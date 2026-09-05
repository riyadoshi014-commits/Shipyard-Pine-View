import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { MatchRing } from "@/components/match/match-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MATCHES, ME } from "@/lib/sample";

export const metadata = { title: "Home" };

export default function DashboardPage() {
  const mine = MATCHES.filter((m) => m.employee.id === ME.id);
  const interested = mine.filter((m) => m.employerFeedback === "interested");

  return (
    <AppShell persona="employee">
      <PageHeader title={`Hi ${ME.fullName.split(" ")[0]}`} description="Here is where you are." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Ability Passport</CardTitle>
            <CardDescription>Live. Anyone with the link or QR code can see it.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button render={<Link href="/app/passport" />}>See my Passport</Button>
            <Button variant="outline" render={<Link href="/app/profile" />}>
              Edit by hand
            </Button>
            <Button variant="outline" render={<Link href="/onboarding" />}>
              Talk to the guide
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
            <CardDescription>
              {mine.length} employer{mine.length === 1 ? "" : "s"} could be a fit.
              {interested.length > 0 && ` ${interested.length} already said they're interested.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <Button variant="outline" render={<Link href="/app/matches" />}>
              See matches
            </Button>
            {mine[0] && <MatchRing score={mine[0].score} size={64} />}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
