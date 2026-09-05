import { Montserrat } from "next/font/google";
import { StoryHome } from "@/components/story-home";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
});

export const metadata = {
  title: "ConnectAble.work — Every ability. A place to belong.",
  description:
    "Real people, meaningful work, and a place on the team. Meet the Inclusion Revolution community and start your own story with an Ability Passport.",
};

export default function Home() {
  return <StoryHome className={montserrat.variable} />;
}
