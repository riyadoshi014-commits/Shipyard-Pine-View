import { Montserrat } from "next/font/google";
import { StoryHome } from "@/components/story-home";
import { FAQ } from "@/components/story-home-faq";
import { JsonLd, organizationJsonLd, faqJsonLd } from "@/lib/seo/structured-data";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
});

export const metadata = {
  title: "ConnectAble.work — Every ability. A place to belong.",
  description:
    "Real people, meaningful work, and a place on the team. Meet the Inclusion Revolution community and start your own story with an Ability Passport.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={faqJsonLd(FAQ)} />
      <StoryHome className={montserrat.variable} />
    </>
  );
}
