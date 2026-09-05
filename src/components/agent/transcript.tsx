export type TranscriptLine = { id: string; who: "you" | "guide"; text: string };

export function Transcript({ lines }: { lines: TranscriptLine[] }) {
  return (
    <ol aria-label="Conversation" aria-live="polite" aria-relevant="additions" className="flex flex-col gap-3">
      {lines.length === 0 && <li className="text-muted-foreground">The conversation will show up here.</li>}
      {lines.map((line) => (
        <li
          key={line.id}
          className={
            line.who === "you"
              ? "max-w-[85%] self-end rounded-2xl bg-green-soft px-4 py-2"
              : "max-w-[85%] self-start rounded-2xl bg-muted px-4 py-2"
          }
        >
          <span className="block text-xs font-bold text-muted-foreground">{line.who === "you" ? "You" : "Guide"}</span>
          {line.text}
        </li>
      ))}
    </ol>
  );
}
