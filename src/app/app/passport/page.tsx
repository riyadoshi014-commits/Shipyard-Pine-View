import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PassportCard } from "@/components/passport/passport-card";
import { PassportShare } from "@/components/passport/passport-qr";
import { Button } from "@/components/ui/button";
import { ME, SITE_URL } from "@/lib/sample";

export const metadata = { title: "My Passport" };

export default function MyPassportPage() {
  const url = `${SITE_URL}/p/${ME.slug}`;
  return (
    <AppShell persona="employee">
      <PageHeader title="My Ability Passport" description="Live. Anyone with the link or QR code can see it.">
        <Button type="button" variant="outline">
          Unpublish
        </Button>
      </PageHeader>
      <div className="grid gap-8 md:grid-cols-[1fr_auto]">
        <PassportCard person={ME} />
        <PassportShare url={url} />
      </div>
    </AppShell>
  );
}
