export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <article className="flex flex-col gap-6">
      <div>
        <p className="ap-label mb-1">Legal</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Privacy policy</h1>
      </div>
      <p className="text-muted-foreground">Draft for review. Last updated September 5, 2026.</p>
      <section>
        <h2 className="ap-rule">What we collect</h2>
        <p>
          Your name, email, and what you choose to put on your Ability Passport: abilities, accommodations, availability,
          your story, education, awards and volunteering. Employers add a company profile and job posts.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">What stays private</h2>
        <p>
          Your pay range is never shown to employers. Your accommodations are only shown to an employer once you match
          with one of their jobs. Your public Passport shows only what you choose to publish, and you can unpublish it at
          any time.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Who can see what</h2>
        <p>
          Employers see published Passports and the match score. Mentors you accept can see and help edit your Passport.
          We do not sell your information.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Questions</h2>
        <p>Contact Inclusion Revolution through TheInclusionRevolution.org.</p>
      </section>
    </article>
  );
}
