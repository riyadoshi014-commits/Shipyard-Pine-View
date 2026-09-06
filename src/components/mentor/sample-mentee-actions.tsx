"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardCheck, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SampleMenteeActions({ fullName, nextAction, lastCheckIn }: { fullName: string; nextAction: string; lastCheckIn: string }) {
  const [followUpComplete, setFollowUpComplete] = useState(false);
  const [checkIn, setCheckIn] = useState(lastCheckIn);
  const [note, setNote] = useState("");
  const [observation, setObservation] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-4" /> Mentor follow-up</CardTitle>
          <CardDescription>{followUpComplete ? "Follow-up completed" : nextAction}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Last check-in: {checkIn}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant={followUpComplete ? "outline" : "default"} onClick={() => { setFollowUpComplete(true); setSaved("Follow-up marked complete for this demo."); }} disabled={followUpComplete}>
              <CheckCircle2 data-icon="inline-start" /> {followUpComplete ? "Completed" : "Mark complete"}
            </Button>
            <Button variant="outline" onClick={() => { setCheckIn("Just now"); setSaved("Check-in recorded for this demo."); }}>
              Record check-in
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule a check-in</CardTitle>
          <CardDescription>Scheduling a live check-in queues a confirmation email to the mentee.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="check-in-time">Date and time</Label>
          <Input id="check-in-time" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
          <Button variant="outline" onClick={() => {
            if (!scheduledFor) {
              setSaved("Choose a date and time before scheduling.");
              return;
            }
            setSaved(`Check-in scheduled for ${new Date(scheduledFor).toLocaleString()}. Demo mode does not email sample mentees.`);
          }}>
            Schedule check-in
          </Button>
        </CardContent>
      </Card>

      <Card className="border-coral/30 bg-coral-soft/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LockKeyhole className="size-4" /> Private mentor note</CardTitle>
          <CardDescription>Visible only to mentors.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="mentor-note">Keep notes factual and useful for the next check-in.</Label>
          <Textarea id="mentor-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder={`Add a private note about ${fullName}.`} />
          <Button variant="outline" onClick={() => setSaved(note.trim() ? "Private note saved for this demo." : "Write a note before saving.")}>Save private note</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Draft an ability observation</CardTitle>
          <CardDescription>The mentee must review and publish it. This does not alter their own words.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="ability-observation">What did you directly observe?</Label>
          <Textarea id="ability-observation" value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="For example: I observed…" />
          <Button onClick={() => setSaved(observation.trim().length >= 10 ? "Draft observation saved for this demo." : "Add at least 10 characters to save an observation.")}>Save draft observation</Button>
        </CardContent>
      </Card>

      {saved && <p role="status" className="rounded-lg bg-green-soft p-3 text-sm font-medium text-green">{saved}</p>}
      <p className="text-xs text-muted-foreground">Demo mode: these actions stay in this browser and do not email sample mentees. The protected check-in API persists a live schedule and queues its email after the database migration is applied.</p>
    </div>
  );
}
