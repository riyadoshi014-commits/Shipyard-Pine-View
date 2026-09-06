import Link from "next/link";

export const metadata = { title: "Employer & Operator Agreement" };

export default function EmployerTermsPage() {
  return (
    <article className="flex flex-col gap-6">
      <div>
        <p className="ap-label mb-1">Legal</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Employer &amp; Operator Agreement</h1>
      </div>
      <p className="text-muted-foreground">
        Draft for review &mdash; not yet checked by a lawyer. Last updated September 6, 2026. This is for any business,
        organization, or operator that posts work on ConnectAble. It goes with the main{" "}
        <Link href="/terms" className="font-bold text-green underline">
          terms and conditions
        </Link>
        .
      </p>
      <section>
        <h2 className="ap-rule">Post real work you can offer</h2>
        <p>
          Describe the tasks you actually need done and the pay you can actually pay. Do not post a role you are not
          ready to fill.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Consider people fairly</h2>
        <p>
          A match score is a starting point, not a decision. You agree to consider matched candidates on their abilities
          and how they would do the work, and to provide the accommodations you listed on the job.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Accommodations are what you offer, not a filter</h2>
        <p>
          The accommodations you list describe your own workplace &mdash; things like written checklists, a consistent
          trainer, or a set schedule. They are never used to screen, rank, or filter candidates. You cannot search for
          people by accommodation, disability, diagnosis, or age, and ConnectAble does not offer a way to.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Interviews stay on the work</h2>
        <p>
          Interview questions and any question suggestions ConnectAble shows you are about demonstrated tasks &mdash;
          &ldquo;walk me through how you would restock this shelf.&rdquo; Do not ask a candidate about disability,
          diagnosis, medication, guardianship, a medical condition, or what happened to them.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">What you can see</h2>
        <p>
          You see published Passports and match scores. You never see a candidate&rsquo;s pay expectations. Use what you
          see only to consider and contact people about your posted work.
        </p>
      </section>
      <section>
        <h2 className="ap-rule">Questions</h2>
        <p>Contact Inclusion Revolution through TheInclusionRevolution.org.</p>
      </section>
    </article>
  );
}
