import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

/**
 * Audit finding F14 (checklist T08, A03).
 * Serves the icon paths from `src/app/icon.png` (512x512) and
 * `src/app/apple-icon.png` (180x180) once those assets exist, or drop PNGs at
 * `public/icon.png` / `public/apple-icon.png`.
 *
 * Colours below are PLACEHOLDERS — replace with the real tokens from
 * `src/app/globals.css` (design spec: no blue in the palette).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#faf6ef", // TODO: match --background
    theme_color: "#1f7a4d", // TODO: match a green token
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
