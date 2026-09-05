import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <Link href="/" className="text-2xl font-bold text-green">
        ConnectAble
      </Link>
      <Card className="w-full max-w-lg">
        <CardContent className="p-6 sm:p-8">{children}</CardContent>
      </Card>
    </main>
  );
}
