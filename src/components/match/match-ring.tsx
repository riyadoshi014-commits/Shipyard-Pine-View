/** Score ring. Colour is a hint; the number and label carry the meaning. */
export function MatchRing({ score, size = 84 }: { score: number; size?: number }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, score)) / 100);
  const label = score >= 75 ? "Strong fit" : score >= 50 ? "Possible fit" : "Low fit";
  const tone = score >= 75 ? "text-green" : score >= 50 ? "text-yellow-foreground" : "text-muted-foreground";

  return (
    <div className="ap-fade flex shrink-0 flex-col items-center gap-1.5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${score} percent match, ${label}`}
        className={tone}
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-foreground text-lg font-extrabold">
          {score}%
        </text>
      </svg>
      <span className="text-[0.7rem] font-bold uppercase tracking-wide">{label}</span>
    </div>
  );
}
