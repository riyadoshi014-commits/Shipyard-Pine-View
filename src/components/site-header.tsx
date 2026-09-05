import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-green">
          ConnectAble
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="lg" render={<Link href="/about" />}>
            About
          </Button>
          <Button variant="outline" size="lg" render={<Link href="/login" />}>
            Log in
          </Button>
          <Button
            size="lg"
            className="bg-coral-strong text-coral-strong-foreground hover:bg-coral-strong/90"
            render={<Link href="/signup" />}
          >
            Get started
          </Button>
        </div>
      </nav>
    </header>
  );
}
