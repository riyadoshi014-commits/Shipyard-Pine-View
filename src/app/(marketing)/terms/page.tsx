import Link from "next/link";

export const metadata = { title: "Terms and conditions" };

export default function TermsPage() {
  return (
    <article className="flex flex-col gap-6">
      <div>
        <p className="ap-label mb-1">Legal</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Terms and conditions</h1>
      </div>
      <p className="text-muted-foreground">Draft for review &mdash; not yet checked by a lawyer. Last updated September 6, 2026.</p>
      <section>
        <h2 className="ap-rule">Using ConnectAble</h2>
        <p>
          ConnectAble is a free service from Inclusion Revolution. Be honest on your profile and in your job posts, treat
          everyone with respect, and only post work you can really offer.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Your content</h2>
        <p>
          You own what you write. You can edit it, delete it, and unpublish your Passport at any time. What we do with
          your information is set out in the{" "}
          <Link href="/privacy" className="font-bold text-green underline">
            privacy policy
          </Link>
          .
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Match scores</h2>
        <p>A match score is a starting point, not a decision. It never decides who gets hired or who gets an interview.</p>
      </section>
      <section>
        <h2 className="ap-rule">The agreement for your role</h2>
        <p>Each role on ConnectAble has its own short agreement. Please read the one that applies to you:</p>
        <ul className="mt-3 flex flex-col gap-2">
          <li>
            <Link href="/terms/employee" className="font-bold text-green underline">
              Job Seeker Agreement
            </Link>
          </li>
          <li>
            <Link href="/terms/employer" className="font-bold text-green underline">
              Employer &amp; Operator Agreement
            </Link>
          </li>
          <li>
            <Link href="/terms/mentor" className="font-bold text-green underline">
              Mentor Agreement
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
}
