import { FACTOR_LABELS, WEIGHTS, type Breakdown } from "@/lib/match/score";

export function BreakdownList({ breakdown }: { breakdown: Breakdown }) {
  const keys = Object.keys(WEIGHTS) as Array<keyof Breakdown>;
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {keys.map((key) => {
        const value = breakdown[key];
        const max = WEIGHTS[key];
        return (
          <li key={key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <span>{FACTOR_LABELS[key]}</span>
            <span className="font-bold tabular-nums">
              {value} / {max}
            </span>
            <div aria-hidden="true" className="col-span-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-green" style={{ width: `${(value / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
