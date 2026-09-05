"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PassportShare({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <aside className="flex flex-col items-center gap-3 print:hidden" aria-label="Share">
      <QRCodeSVG
        value={url}
        size={192}
        level="M"
        marginSize={2}
        role="img"
        aria-label={`QR code that opens ${url}`}
        className="rounded-lg bg-white"
      />
      <p className="max-w-52 text-center text-sm break-all">{url}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer aria-hidden="true" /> Print
        </Button>
      </div>
      <span role="status" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
      <p className="max-w-52 text-center text-xs text-muted-foreground">
        For an NFC card, write this link to the tag with any NFC tools app.
      </p>
    </aside>
  );
}
