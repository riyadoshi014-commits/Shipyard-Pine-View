export const metadata = { title: "About" };

const TEAM = [
  { name: "Istiqlal", role: "Frontend and platform" },
  { name: "Delilah", role: "Brand and colour" },
  { name: "Mitron", role: "Features and the job seeker journey" },
  { name: "Riya", role: "Interface content and the mentor journey" },
  { name: "Maria", role: "Marketing and outreach" },
  { name: "Maya", role: "The employer journey" },
];

export default function AboutPage() {
  return (
    <article className="flex flex-col gap-10">
      <header>
        <p className="ap-label mb-1">About us</p>
        <h1 className="text-4xl font-extrabold tracking-tight">About ConnectAble</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          ConnectAble matches people with intellectual and developmental disabilities to employers who can support them,
          with mentors as the bridge. It was built in 48 hours for Inclusion Revolution.
        </p>
      </header>

      <section>
        <h2 className="ap-rule">Inclusion Revolution</h2>
        <p>
          Inclusion Revolution provides secure, successful jobs for individuals with intellectual and developmental
          disabilities in the Sarasota and Manatee area, through integrated job placement, the Rooted &amp; Rising
          garden-to-market program, Rise Up coffee carts and a catering crew. ConnectAble is the platform that lets that
          work scale.
        </p>
        <a href="https://TheInclusionRevolution.org" className="mt-3 inline-block font-bold text-green underline">
          Visit TheInclusionRevolution.org
        </a>
      </section>

      <section>
        <h2 className="ap-rule">The team</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TEAM.map((m) => (
            <li key={m.name} className="rounded-2xl border bg-card p-4 shadow-[var(--ap-shadow-md)]">
              <p className="font-bold">{m.name}</p>
              <p className="text-sm text-muted-foreground">{m.role}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="ap-rule">The words we use</h2>
        <p>
          We say <strong>abilities</strong> when we talk about what someone can do, and{" "}
          <strong>accommodations</strong> when we talk about what helps them do it well.
        </p>
      </section>
    </article>
  );
}
