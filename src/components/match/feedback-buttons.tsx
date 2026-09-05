import { Button } from "@/components/ui/button";
import type { FeedbackValue } from "@/lib/domain";
import { giveFeedback } from "@/lib/match/actions";

/** Two server-action forms; works without client JavaScript. */
export function FeedbackButtons({
  matchId,
  current,
  back,
  vertical = false,
}: {
  matchId: string;
  current: FeedbackValue | null;
  back: string;
  vertical?: boolean;
}) {
  return (
    <div className={vertical ? "flex flex-col gap-2" : "flex flex-row gap-2"}>
      <form action={giveFeedback}>
        <input type="hidden" name="match_id" value={matchId} />
        <input type="hidden" name="value" value="interested" />
        <input type="hidden" name="back" value={back} />
        <Button type="submit" variant={current === "interested" ? "default" : "outline"} aria-pressed={current === "interested"} className="w-full">
          {current === "interested" ? "Interested ✓" : "Interested"}
        </Button>
      </form>
      <form action={giveFeedback}>
        <input type="hidden" name="match_id" value={matchId} />
        <input type="hidden" name="value" value="not_now" />
        <input type="hidden" name="back" value={back} />
        <Button type="submit" variant={current === "not_now" ? "secondary" : "outline"} aria-pressed={current === "not_now"} className="w-full">
          {current === "not_now" ? "Not now ✓" : "Not now"}
        </Button>
      </form>
    </div>
  );
}
