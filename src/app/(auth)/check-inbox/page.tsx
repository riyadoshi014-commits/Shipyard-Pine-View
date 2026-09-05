import { MailCheck } from "lucide-react";

export const metadata = { title: "Check your inbox" };

export default async function CheckInboxPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <MailCheck aria-hidden="true" className="size-12 text-green" />
      <h1 className="text-3xl font-bold">Check your inbox</h1>
      <p>We sent a confirmation link{email ? ` to ${email}` : ""}. Open it to finish signing up.</p>
      <p className="text-sm text-muted-foreground">Not there after a minute? Look in spam, or try signing up again.</p>
    </div>
  );
}
