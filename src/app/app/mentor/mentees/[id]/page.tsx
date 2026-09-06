import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SAMPLE_MENTEES } from "@/components/mentor/sample-mentee-dashboard";
import { SampleMenteeActions } from "@/components/mentor/sample-mentee-actions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Mentee profile" };

export default async function MenteeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mentee = SAMPLE_MENTEES.find((candidate) => candidate.id === id);
  if (!mentee) notFound();

  return (
    <>
      <PageHeader title={mentee.fullName} description={mentee.headline}>
        <Button variant="outline" render={<Link href="/app" />}><ArrowLeft data-icon="inline-start" /> Back to mentees</Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Ability Passport</CardTitle><CardDescription>{mentee.about}</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <section><h2 className="mb-2 font-bold">Abilities</h2><div className="flex flex-wrap gap-2">{mentee.abilities.map((ability) => <Badge key={ability} variant="secondary">{ability}</Badge>)}</div></section>
            <section><h2 className="mb-2 font-bold">Availability</h2><p className="text-muted-foreground">{mentee.availability.join(" · ")}</p></section>
            <section><h2 className="mb-2 font-bold">Accommodations</h2><div className="flex flex-wrap gap-2">{mentee.accommodations.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div></section>
          </CardContent>
        </Card>
        <SampleMenteeActions fullName={mentee.fullName} nextAction={mentee.nextAction} lastCheckIn={mentee.lastCheckIn} />
      </div>
    </>
  );
}
