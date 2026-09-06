import { Award, Clock, GraduationCap, HandHeart, MapPin } from "lucide-react";
import type { HistoryItem } from "@/lib/domain";
import { REMOTE_LABEL, type SampleEmployee } from "@/lib/sample";

function HistoryGroup({ title, Icon, items }: { title: string; Icon: typeof Award; items: HistoryItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 font-bold">
        <Icon aria-hidden="true" className="size-5 text-green" /> {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={`${item.title}-${i}`}>
            <span className="font-bold">{item.title}</span>
            {(item.org || item.year) && (
              <span className="text-muted-foreground"> · {[item.org, item.year].filter(Boolean).join(", ")}</span>
            )}
            {item.details && <span className="block text-sm">{item.details}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The public Ability Passport. Never shows accommodations or pay. */
export function PassportCard({ person }: { person: SampleEmployee }) {
  const place = [person.city, person.state].filter(Boolean).join(", ");
  return (
    <article className="flex flex-col gap-6 rounded-2xl border-2 border-green bg-card p-6 shadow-[var(--ap-shadow-md)] sm:p-8">
      <header>
        <p className="text-sm font-bold text-green">Ability Passport</p>
        <h2 className="text-3xl font-bold">{person.fullName}</h2>
        {person.headline && <p className="mt-1 text-lg">{person.headline}</p>}
        <p className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {place && (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" className="size-4" /> {place}
            </span>
          )}
          <span>{REMOTE_LABEL[person.remotePreference]}</span>
        </p>
      </header>

      {person.abilities.length > 0 && (
        <section>
          <h3 className="mb-2 font-bold">Abilities</h3>
          <ul className="flex flex-wrap gap-2">
            {person.abilities.map((a) => (
              <li key={a} className="rounded-full bg-green-soft px-3 py-1 text-sm font-bold text-green">
                {a}
              </li>
            ))}
          </ul>
        </section>
      )}

      {person.about && (
        <section>
          <h3 className="mb-2 font-bold">About</h3>
          <p>{person.about}</p>
        </section>
      )}

      {person.availability.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-2 font-bold">
            <Clock aria-hidden="true" className="size-5 text-green" /> Available
          </h3>
          <p>{person.availability.join(", ")}</p>
        </section>
      )}

      <HistoryGroup title="Education and training" Icon={GraduationCap} items={person.education} />
      <HistoryGroup title="Awards" Icon={Award} items={person.awards} />
      <HistoryGroup title="Volunteering" Icon={HandHeart} items={person.volunteer} />
    </article>
  );
}
