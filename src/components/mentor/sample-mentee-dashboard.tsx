import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CalendarDays, ClipboardList, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { ME, OTHER_EMPLOYEES, type SampleEmployee } from "@/lib/sample";

export type SampleMentee = SampleEmployee & {
  progress: number;
  nextAction: string;
  lastCheckIn: string;
};

const mentorDetails: Record<string, Omit<SampleMentee, keyof SampleEmployee>> = {
  nick: { progress: 82, nextAction: "Review his Service Greeter match", lastCheckIn: "Today" },
  priya: { progress: 68, nextAction: "Add her animal-care observation", lastCheckIn: "Yesterday" },
  marcus: { progress: 74, nextAction: "Confirm morning availability", lastCheckIn: "Sep 3" },
  elena: { progress: 61, nextAction: "Review a draft ability", lastCheckIn: "Sep 2" },
  tyler: { progress: 56, nextAction: "Plan a garden-center introduction", lastCheckIn: "Aug 30" },
};

export const SAMPLE_MENTEES: SampleMentee[] = [ME, ...OTHER_EMPLOYEES].map((employee) => ({
  ...employee,
  ...mentorDetails[employee.id],
}));

function Initials({ name }: { name: string }) {
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-coral-soft font-bold text-coral-foreground" aria-hidden="true">
      {name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
    </div>
  );
}

export function SampleMenteeDashboard({ firstName }: { firstName: string }) {
  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold text-coral-foreground">Demo mentor workspace</p>
          <h1 className="text-3xl font-bold tracking-tight">Hi {firstName}</h1>
          <p className="mt-1 text-muted-foreground">Here are five sample mentees to help you review the mentor workflow.</p>
        </div>
        <Badge variant="outline">Sample data</Badge>
      </div>

      <section aria-label="Mentor summary" className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={<UsersRound />} label="Assigned mentees" value="5" detail="Active demo relationships" />
        <SummaryCard icon={<CalendarDays />} label="Check-ins this week" value="3" detail="One scheduled for today" />
        <SummaryCard icon={<ClipboardList />} label="Open follow-ups" value="5" detail="One next step per mentee" />
      </section>

      <section aria-labelledby="mentees-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="mentees-heading" className="text-xl font-bold">Your mentees</h2>
          <span className="text-sm text-muted-foreground">Demo profiles</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {SAMPLE_MENTEES.map((mentee) => (
            <Card key={mentee.id}>
              <CardHeader>
                <div className="flex gap-3">
                  <Initials name={mentee.fullName} />
                  <div className="min-w-0">
                    <CardTitle>{mentee.fullName}</CardTitle>
                    <CardDescription>{mentee.headline}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5" aria-label={`${mentee.fullName}'s abilities`}>
                  {mentee.abilities.slice(0, 3).map((ability) => <Badge key={ability} variant="secondary">{ability}</Badge>)}
                </div>
                <Progress value={mentee.progress}>
                  <ProgressLabel>Profile progress</ProgressLabel>
                  <ProgressValue />
                </Progress>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Last check-in</dt><dd className="font-medium">{mentee.lastCheckIn}</dd></div>
                  <div><dt className="text-muted-foreground">Next step</dt><dd className="font-medium">{mentee.nextAction}</dd></div>
                </dl>
                <Button className="w-full sm:w-auto" render={<Link href={`/app/mentor/mentees/${mentee.id}`} />}>
                  View demo profile <ArrowRight data-icon="inline-end" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

function SummaryCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3">
        <span className="rounded-lg bg-green-soft p-2 text-green" aria-hidden="true">{icon}</span>
        <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{detail}</p></div>
      </CardContent>
    </Card>
  );
}
