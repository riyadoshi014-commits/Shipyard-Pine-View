import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Server-rendered JSON-LD (audit F4 / F6 / F8).
 *
 * MUST be rendered from a Server Component so the markup is in the initial HTML.
 * Per Google's Dec-2025 guidance, JavaScript-injected structured data can face
 * delayed processing. Do NOT move these into `"use client"` components.
 *
 * Not yet wired up — the landing page (F4/F8) and /p/[slug] (F6) still need the
 * edits in APPLY.md steps 3-4. Committed now so the helpers exist for that pass.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output; no user HTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** F4 — Organization + WebSite. Switch to `LocalBusiness` ONLY once a real
 *  public street address + hours exist. */
export function organizationJsonLd(): Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      email: "info@connectable.work",
      telephone: "+1-941-239-4045",
      description:
        "Inclusive-hiring platform connecting people with intellectual and developmental disabilities to supportive employers, with mentors as the bridge.",
      areaServed: [
        { "@type": "AdministrativeArea", name: "Sarasota County, Florida" },
        { "@type": "AdministrativeArea", name: "Manatee County, Florida" },
      ],
      parentOrganization: {
        "@type": "Organization",
        name: "Inclusion Revolution",
        url: "https://TheInclusionRevolution.org",
      },
      sameAs: [
        "https://TheInclusionRevolution.org",
        "https://www.thegivingpartner.org",
        "https://x.com/Connectablework",
        "https://www.tiktok.com/@connectable",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  ];
}

/** F8 — FAQPage. Pass the SAME array the landing page renders (APPLY.md step 7:
 *  lift the Q&A pairs into a shared `FAQ` const). */
export function faqJsonLd(
  faq: ReadonlyArray<readonly [string, string]>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

/** F6 — ProfilePage + Person for a published Ability Passport. Only ever called
 *  for `passport_public = true` rows; already-public fields only. */
export function passportJsonLd(p: {
  slug: string;
  fullName: string;
  headline: string;
  city: string;
  state: string;
  abilities: string[];
  education: { title: string; org: string; year?: string }[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE_URL}/p/${p.slug}`,
    mainEntity: {
      "@type": "Person",
      name: p.fullName,
      description: p.headline,
      ...(p.city && p.state
        ? {
            address: {
              "@type": "PostalAddress",
              addressLocality: p.city,
              addressRegion: p.state,
            },
          }
        : {}),
      ...(p.abilities.length ? { knowsAbout: p.abilities } : {}),
      ...(p.education.length
        ? {
            alumniOf: p.education.map((e) => ({
              "@type": "EducationalOrganization",
              name: e.org,
            })),
          }
        : {}),
    },
  };
}
