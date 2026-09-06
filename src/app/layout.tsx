import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { ConsentBanner } from "@/components/consent-banner";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Designed by the Braille Institute for low-vision legibility.
const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ConnectAble", template: "%s · ConnectAble" },
  description:
    "ConnectAble connects people with intellectual and developmental disabilities to employers who can support them, with mentors as the bridge.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${atkinson.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-yellow focus:px-4 focus:py-2 focus:font-bold focus:text-yellow-foreground"
        >
          Skip to main content
        </a>
        {children}
        <ConsentBanner />
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
