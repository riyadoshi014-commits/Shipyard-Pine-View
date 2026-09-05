/** Score ring. Colour is a hint; the number and label carry the meaning. */
export function MatchRing({ score, size = 76 }: { score: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, score)) / 100);
  const label = score >= 75 ? "Strong fit" : score >= 50 ? "Possible fit" : "Low fit";
  const tone = score >= 75 ? "text-green" : score >= 50 ? "text-yellow-foreground" : "text-muted-foreground";

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${score} percent match, ${label}`}
        className={tone}
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={stroke} />
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
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-foreground text-base font-bold">
          {score}%
        </text>
      </svg>
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}
