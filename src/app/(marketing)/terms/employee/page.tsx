import Link from "next/link";

export const metadata = { title: "Job Seeker Agreement" };

export default function EmployeeTermsPage() {
  return (
    <article className="flex flex-col gap-6">
      <div>
        <p className="ap-label mb-1">Legal</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Job Seeker Agreement</h1>
      </div>
      <p className="text-muted-foreground">
        Draft for review &mdash; not yet checked by a lawyer. Last updated September 6, 2026. This is for people using
        ConnectAble to look for work. It goes with the main{" "}
        <Link href="/terms" className="font-bold text-green underline">
          terms and conditions
        </Link>
        .
      </p>
      <section>
        <h2 className="ap-rule">Your Ability Passport</h2>
        <p>
          Your Passport is your abilities, accommodations, availability, your story, and your history &mdash; in your own
          words and in a version you approve. Put in what is true. You can change or delete any part of it, and unpublish
          the whole thing, at any time.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Your pay range stays private</h2>
        <p>The hourly pay range you enter is never shown to employers. It is used only to help find jobs that fit you.</p>
      </section>
      <section>
        <h2 className="ap-rule">Nothing is shared without your say-so</h2>
        <p>
          Your accommodations are shown to an employer only after you match with one of their jobs. Nothing about you
          reaches an employer until you and your mentor have both looked at it and agreed.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Match scores</h2>
        <p>
          A match score shows how well a job and your abilities line up. It is a starting point for a conversation, not a
          decision about you.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Getting help</h2>
        <p>
          A mentor you accept can see your Passport and help you edit it. You can remove a mentor at any time. Contact
          Inclusion Revolution through TheInclusionRevolution.org.
        </p>
      </section>
    </article>
  );
}
