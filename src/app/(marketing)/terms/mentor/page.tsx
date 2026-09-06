import Link from "next/link";

export const metadata = { title: "Mentor Agreement" };

export default function MentorTermsPage() {
  return (
    <article className="flex flex-col gap-6">
      <div>
        <p className="ap-label mb-1">Legal</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Mentor Agreement</h1>
      </div>
      <p className="text-muted-foreground">
        Draft for review &mdash; not yet checked by a lawyer. Last updated September 6, 2026. This is for mentors who
        support job seekers on ConnectAble. It goes with the main{" "}
        <Link href="/terms" className="font-bold text-green underline">
          terms and conditions
        </Link>
        .
      </p>
      <section>
        <h2 className="ap-rule">You are the bridge</h2>
        <p>
          A mentor helps a job seeker build and share their Ability Passport. You act with them, not for them. The
          Passport stays theirs to decide about.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Represent people honestly</h2>
        <p>
          Help write abilities and a story in plain, true language. Do not add a skill, a claim, or a detail the person
          did not tell you. Keep their own words alongside any rewrite.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Only approve what they have seen</h2>
        <p>
          Nothing goes to an employer until the job seeker has seen it and agreed. Do not publish or send a Passport on
          someone&rsquo;s behalf without their say-so.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Keep private things private</h2>
        <p>
          You may see a person&rsquo;s pay range and personal details to help them. Keep that information confidential and
          use it only to support them on ConnectAble.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Ending the relationship</h2>
        <p>
          A job seeker can remove you as a mentor at any time. Contact Inclusion Revolution through
          TheInclusionRevolution.org.
        </p>
      </section>
    </article>
  );
}
