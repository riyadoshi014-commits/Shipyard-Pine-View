#!/usr/bin/env node
/**
 * Generates the three image assets the SEO audit's F7/F14 fixes reference
 * (public/og.png, src/app/icon.png, src/app/apple-icon.png) using the site's
 * REAL design tokens (--green / --green-foreground / --background, light
 * mode, from src/app/globals.css) rather than invented placeholder colors.
 *
 * No image-editing tool was available in this environment, so this draws
 * flat-color PNGs by hand: a rounded-square "C" mark identical in shape to
 * the real in-app .ap-logo-mark (see globals.css), and a small hardcoded
 * bitmap font for the "ConnectAble" wordmark on the OG card. Zero deps —
 * only Node's built-in zlib for the PNG DEFLATE stream and a hand-rolled
 * CRC32/PNG encoder.
 *
 * These are intentionally simple, on-brand placeholders. Swap for real
 * designed assets (same filenames, same paths) whenever the team has one —
 * nothing else needs to change, the metadata/manifest already reference
 * these exact paths.
 *
 * Run: node scripts/generate-seo-assets.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------
// OKLCH -> sRGB, matching CSS Color Module 4 / what the browser renders
// for the tokens in src/app/globals.css (light mode / :root).
// ---------------------------------------------------------------------
function oklchToRgb(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const toSrgb = (c) => {
    const clamped = Math.min(1, Math.max(0, c));
    const srgb =
      clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, srgb)) * 255);
  };

  return [toSrgb(rLin), toSrgb(gLin), toSrgb(bLin)];
}

// src/app/globals.css :root (light mode)
const GREEN = oklchToRgb(0.5, 0.13, 155); // --green
const GREEN_FOREGROUND = oklchToRgb(0.99, 0, 0); // --green-foreground
const BACKGROUND = oklchToRgb(0.985, 0.006, 95); // --background

// ---------------------------------------------------------------------
// Minimal PNG encoder (RGB, no alpha needed — these are opaque cards).
// ---------------------------------------------------------------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, getPixel /* (x, y) => [r, g, b] */) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filter type: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }
  const idatData = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdrData),
    chunk("IDAT", idatData),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------
// Tiny 5x7 dot-matrix font — only the glyphs "ConnectAble" needs.
// 1 = ink, 0 = background. Rows top-to-bottom, 5 columns per glyph.
// ---------------------------------------------------------------------
const FONT = {
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  o: ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  n: ["00000", "00000", "10110", "11001", "10001", "10001", "10001"],
  e: ["00000", "00000", "01110", "10001", "11111", "10000", "01110"],
  c: ["00000", "00000", "01111", "10000", "10000", "10000", "01111"],
  t: ["00100", "01110", "00100", "00100", "00100", "00100", "00011"],
  b: ["10000", "10000", "10110", "11001", "10001", "10001", "11110"],
  l: ["10000", "10000", "10000", "10000", "10000", "10000", "10000"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

const LETTER_SPACING_RATIO = 0.5;

// Real per-glyph width in font-cell units (rightmost lit column + 1), so a
// narrow glyph like "l" doesn't drag a full 5-wide gap after it.
const GLYPH_WIDTH = { C: 5, A: 5, o: 5, n: 5, e: 5, c: 5, t: 5, b: 4, l: 1, " ": 3 };

function glyphAdvance(ch, cell) {
  return (GLYPH_WIDTH[ch] ?? 5) * cell;
}

function textWidth(text, cell) {
  const spacing = Math.round(cell * LETTER_SPACING_RATIO);
  let width = 0;
  for (const ch of text) width += glyphAdvance(ch, cell) + spacing;
  return width - spacing;
}

/** Paints `text` into a plain 2D pixel grid (mutating `pixels`). */
function drawText(pixels, width, text, startX, startY, cell, color) {
  const spacing = Math.round(cell * LETTER_SPACING_RATIO);
  let x = startX;
  for (const ch of text) {
    const glyph = FONT[ch] ?? FONT[" "];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === "1") {
          for (let dy = 0; dy < cell; dy++) {
            for (let dx = 0; dx < cell; dx++) {
              const px = x + col * cell + dx;
              const py = startY + row * cell + dy;
              if (px >= 0 && px < width && py >= 0) setPixel(pixels, width, px, py, color);
            }
          }
        }
      }
    }
    x += glyphAdvance(ch, cell) + spacing;
  }
}

function setPixel(pixels, width, x, y, color) {
  const row = pixels[y];
  if (!row) return;
  row[x] = color;
}

function makeCanvas(width, height, bg) {
  const pixels = [];
  for (let y = 0; y < height; y++) pixels.push(new Array(width).fill(bg));
  return pixels;
}

function fillRoundedRect(pixels, width, x0, y0, w, h, radius, color) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const inCorner =
        (x < x0 + radius && y < y0 + radius) ||
        (x >= x0 + w - radius && y < y0 + radius) ||
        (x < x0 + radius && y >= y0 + h - radius) ||
        (x >= x0 + w - radius && y >= y0 + h - radius);
      if (!inCorner) {
        setPixel(pixels, width, x, y, color);
        continue;
      }
      const cx = x < x0 + radius ? x0 + radius : x0 + w - radius;
      const cy = y < y0 + radius ? y0 + radius : y0 + h - radius;
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      if (dx * dx + dy * dy <= radius * radius) setPixel(pixels, width, x, y, color);
    }
  }
}

function pixelsToPng(pixels, width, height) {
  return encodePng(width, height, (x, y) => pixels[y][x]);
}

// ---------------------------------------------------------------------
// 1. icon.png — 512x512 solid green square, big white "C" (favicon /
//    home-screen icon; OS applies its own mask, so no pre-rounding here —
//    matches Apple's guidance for source icon art).
// ---------------------------------------------------------------------
function buildIcon(size) {
  const pixels = makeCanvas(size, size, GREEN);
  const cell = Math.round((size * 0.62) / 5); // "C" fills ~62% of the icon width
  const glyphW = 5 * cell;
  const glyphH = 7 * cell;
  drawText(
    pixels,
    size,
    "C",
    Math.round((size - glyphW) / 2),
    Math.round((size - glyphH) / 2),
    cell,
    GREEN_FOREGROUND,
  );
  return pixelsToPng(pixels, size, size);
}

// ---------------------------------------------------------------------
// 2. og.png — 1200x630, cream background, the same mark + "ConnectAble"
//    wordmark as a horizontal lockup (mirrors the real header: rounded
//    green "C" chip + name), centered.
// ---------------------------------------------------------------------
function buildOg() {
  const width = 1200;
  const height = 630;
  const pixels = makeCanvas(width, height, BACKGROUND);

  const textCell = 14;
  const wordmark = "ConnectAble";
  const textW = textWidth(wordmark, textCell);
  const textH = 7 * textCell;

  const markSize = 150;
  const markRadius = Math.round(markSize * 0.28);
  const gap = 40;

  const totalW = markSize + gap + textW;
  const startX = Math.round((width - totalW) / 2);
  const centerY = Math.round(height / 2);

  const markY = centerY - Math.round(markSize / 2);
  fillRoundedRect(pixels, width, startX, markY, markSize, markSize, markRadius, GREEN);

  const markGlyphCell = Math.round((markSize * 0.5) / 5);
  const markGlyphW = 5 * markGlyphCell;
  const markGlyphH = 7 * markGlyphCell;
  drawText(
    pixels,
    width,
    "C",
    startX + Math.round((markSize - markGlyphW) / 2),
    markY + Math.round((markSize - markGlyphH) / 2),
    markGlyphCell,
    GREEN_FOREGROUND,
  );

  const textX = startX + markSize + gap;
  const textY = centerY - Math.round(textH / 2);
  drawText(pixels, width, wordmark, textX, textY, textCell, GREEN);

  return pixelsToPng(pixels, width, height);
}

// ---------------------------------------------------------------------

const iconPng = buildIcon(512);
writeFileSync(path.join(repoRoot, "src/app/icon.png"), iconPng);
console.log(`wrote src/app/icon.png (${iconPng.length} bytes)`);

const appleIconPng = buildIcon(180);
writeFileSync(path.join(repoRoot, "src/app/apple-icon.png"), appleIconPng);
console.log(`wrote src/app/apple-icon.png (${appleIconPng.length} bytes)`);

const ogPng = buildOg();
writeFileSync(path.join(repoRoot, "public/og.png"), ogPng);
console.log(`wrote public/og.png (${ogPng.length} bytes)`);

console.log(
  `colors used: green=rgb(${GREEN}) green-foreground=rgb(${GREEN_FOREGROUND}) background=rgb(${BACKGROUND})`,
);
