import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PassportCard } from "@/components/passport/passport-card";
import { PassportShare } from "@/components/passport/passport-qr";
import { Button } from "@/components/ui/button";
import { getOwnPassport } from "@/lib/data/passport";
import { requireRole } from "@/lib/data/profile";
import { publishPassport, unpublishPassport } from "@/lib/profile/actions";
import { SITE_URL } from "@/lib/sample";

export const metadata = { title: "My Passport" };

export default async function MyPassportPage() {
  const { userId } = await requireRole("employee");
  const passport = await getOwnPassport(userId);
  const url = passport?.slug ? `${SITE_URL}/p/${passport.slug}` : null;
  const ready = Boolean(passport && passport.headline && passport.abilities.length > 0);

  return (
    <>
      <PageHeader
        title="My Ability Passport"
        description={passport?.isPublic ? "Live. Anyone with the link or QR code can see it." : "Not published yet. Only you can see this preview."}
      >
        {passport?.isPublic ? (
          <form action={unpublishPassport}>
            <Button type="submit" variant="outline">
              Unpublish
            </Button>
          </form>
        ) : (
          <form action={publishPassport}>
            <Button type="submit" disabled={!ready}>
              Publish my Passport
            </Button>
          </form>
        )}
      </PageHeader>

      {!ready && (
        <p className="mb-6 rounded-md bg-yellow-soft p-3">
          Add a headline and at least one ability before publishing.{" "}
          <Link href="/app/profile" className="font-bold text-green underline">
            Edit profile
          </Link>{" "}
          or{" "}
          <Link href="/onboarding" className="font-bold text-green underline">
            talk to the guide
          </Link>
          .
        </p>
      )}

      {passport && (
        <div className="grid gap-8 md:grid-cols-[1fr_auto]">
          <PassportCard person={passport} />
          {passport.isPublic && url && <PassportShare url={url} />}
        </div>
      )}
    </>
  );
}
