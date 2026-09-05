export const metadata = { title: "Terms and conditions" };

export default function TermsPage() {
  return (
    <article className="flex flex-col gap-6">
      <h1 className="text-4xl font-bold">Terms and conditions</h1>
      <p className="text-muted-foreground">Draft for review. Last updated September 5, 2026.</p>
      <section>
        <h2 className="mb-2 text-xl font-bold">Using ConnectAble</h2>
        <p>
          ConnectAble is a free service from Inclusion Revolution. Be honest on your profile, treat people with respect,
          and only post jobs you can really offer.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-bold">Employers</h2>
        <p>
          Match scores are a starting point, not a decision. Employers agree to consider candidates fairly and to provide
          the accommodations they list on a job.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-bold">Your content</h2>
        <p>You own what you write. You can edit or delete it, and unpublish your Passport, at any time.</p>
      </section>
    </article>
  );
}
