import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Audit finding F2 (checklist T02 P0, A04 P1).
 *
 * AI-crawler stance: ConnectAble is a mission-driven inclusive-hiring nonprofit
 * that WANTS to be discoverable in AI answers, so GPTBot / ClaudeBot /
 * PerplexityBot / Google-Extended are intentionally NOT disallowed. If that
 * policy changes, add per-user-agent rules here.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app/",
          "/api/",
          "/auth/",
          "/onboarding",
          "/login",
          "/signup",
          "/check-inbox",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
