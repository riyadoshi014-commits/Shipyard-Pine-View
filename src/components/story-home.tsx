"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Play, X } from "lucide-react";
import styles from "./story-home.module.css";

const films = {
  nick: { title: "Nick’s story: The Drive to Include", file: "nick", portrait: false },
  adam: { title: "A conversation with Adam", file: "adam", portrait: true },
  cards: { title: "A moment at the card table", file: "cards", portrait: true },
};
type FilmId = keyof typeof films;

export function StoryHome() {
  const [activeFilm, setActiveFilm] = useState<FilmId | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const film = activeFilm ? films[activeFilm] : null;

  useEffect(() => {
    if (activeFilm) dialog.current?.showModal();
    else dialog.current?.close();
  }, [activeFilm]);

  useEffect(() => {
    const elements = page.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!elements || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.visible);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach((element) => {
      element.classList.add(styles.reveal);
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  function openFilm(id: FilmId, button: HTMLButtonElement) {
    trigger.current = button;
    setActiveFilm(id);
  }
  function closeFilm() {
    dialog.current?.close();
    setActiveFilm(null);
    trigger.current?.focus();
  }

  return (
    <div className={styles.site} ref={page}>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark} aria-label="ConnectAble home"><span className={styles.brandSymbol} aria-hidden="true"><i /><i /></span>ConnectAble<span className={styles.brandDot}>.</span></Link>
        <nav aria-label="Main navigation" className={styles.navigation}>
          <a href="#stories">Real stories</a><a href="#how-it-works">How it works</a>
          <Link href="/login" className={styles.login}>Log in</Link>
          <Link href="/signup" className={styles.navCta}>Find your next step <ArrowUpRight size={17} /></Link>
        </nav>
      </header>
      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-title">
          <Image src="/stories/nick-team.jpg" alt="Nick and a colleague working together at Sarasota Ford" fill preload sizes="100vw" className={styles.heroImage} />
          <div className={styles.heroShade} />
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>People. Possibility. A place to belong.</p>
            <h1 id="hero-title">ConnectAble<span>.</span></h1>
            <p className={styles.heroPromise}>A job is a beginning.<br />Belonging is what comes next.</p>
            <button className={styles.watchButton} onClick={(event) => openFilm("nick", event.currentTarget)}><span className={styles.playCircle}><Play size={19} fill="currentColor" /></span><span>Meet Nick <small>Watch his story · 3 min</small></span></button>
          </div>
          <div className={styles.heroFoot}>
            <span>With Inclusion Revolution<br /><strong>Sarasota–Manatee, Florida</strong></span>
            <a href="#stories" aria-label="Explore the stories"><ArrowDown size={20} /></a>
            <span className={styles.heroCredit}>Nick, on the job<br /><strong>Sarasota Ford</strong></span>
          </div>
        </section>
        <section id="stories" className={styles.intro} data-reveal>
          <p className={styles.sectionLabel}>01 / A place on the team</p>
          <div><h2>The work matters.<br /><span>So do the people beside you.</span></h2><p>For Nick, a day at Sarasota Ford means cars to get ready, music with a colleague, and lunch with the team. His story is where we begin.</p><button className={styles.textButton} onClick={(event) => openFilm("nick", event.currentTarget)}>Watch Nick’s full story <ArrowUpRight size={20} /></button></div>
        </section>
        <section className={styles.nickFeature} aria-label="Nick at work" data-reveal>
          <div className={styles.workImage}><Image src="/stories/nick-work.jpg" alt="Nick carefully detailing the inside of a vehicle" fill sizes="(max-width: 700px) 100vw, 60vw" /><span>Care in the details.</span></div>
          <div className={styles.workCopy}><p className={styles.sectionLabel}>Nick at Sarasota Ford</p><h2>Good at the work.<br />Part of the team.</h2><p>Inclusion Revolution helped connect his ability with an employer. His colleagues’ stories show what followed: trusted work and everyday connection.</p><Link href="/signup" className={styles.textLink}>Build your team <ArrowRight size={20} /></Link></div>
        </section>
        <section className={styles.smallStories} aria-labelledby="small-stories-title">
          <div className={styles.storiesHeading} data-reveal><p className={styles.sectionLabel}>02 / In their own world</p><h2 id="small-stories-title">The little things<br />tell a bigger story.</h2><p>A conversation about work. Time spent on something you enjoy. There is a whole person behind every profile.</p></div>
          <div className={styles.portraitStories}>
            <article data-reveal><button className={styles.portraitButton} aria-label="Watch a conversation with Adam, 30 seconds" onClick={(event) => openFilm("adam", event.currentTarget)}><Image src="/stories/adam.jpg" alt="Adam speaking in a kitchen" fill sizes="(max-width: 700px) 45vw, 30vw" /><span className={styles.filmTag}><Play size={16} fill="currentColor" /> 0:30</span></button><h3>Meet Adam.</h3><p>A short conversation about his work at The Cheesecake Factory, the people, and the everyday perks.</p></article>
            <article data-reveal><button className={styles.portraitButton} aria-label="Watch a moment at the card table, 11 seconds" onClick={(event) => openFilm("cards", event.currentTarget)}><Image src="/stories/cards.jpg" alt="A person looking closely at trading cards at a table" fill sizes="(max-width: 700px) 45vw, 30vw" /><span className={styles.filmTag}><Play size={16} fill="currentColor" /> 0:11</span></button><h3>A moment of focus.</h3><p>At the card table, an interest gets someone’s full attention. A small glimpse of a life beyond a résumé.</p></article>
          </div>
        </section>
        <section id="how-it-works" className={styles.howItWorks} aria-labelledby="how-title">
          <div className={styles.howHeading} data-reveal><p className={styles.sectionLabel}>03 / Your next connection</p><h2 id="how-title">Start with the person.<br /><span>Build from there.</span></h2><p>ConnectAble brings job seekers, employers, and mentors together—with ability at the center.</p></div>
          <div className={styles.steps}>{[
            ["01", "Share your whole story.", "Your Ability Passport brings together your abilities, interests, and experience in one shareable profile."],
            ["02", "Find a place that fits.", "Look for work that fits your abilities and availability, with accommodations that support you."],
            ["03", "Take the next step together.", "Connect with employers and bring a mentor into the conversation when you want support."],
          ].map(([number, title, text]) => <div className={styles.step} key={number} data-reveal><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>
        </section>
        <section className={styles.faq} aria-labelledby="faq-title" data-reveal>
          <div><p className={styles.sectionLabel}>A few helpful answers</p><h2 id="faq-title">You can start<br />with questions.</h2></div>
          <div>{[
            ["Who is ConnectAble for?", "ConnectAble is being built for job seekers with intellectual and developmental disabilities, employers who want to hire inclusively, and mentors who support the connection."],
            ["What is an Ability Passport?", "It is a shareable profile about you: your abilities, experience, interests, and story. It gives a future employer a way to get to know more of who you are."],
            ["I’m an employer. Where do I begin?", "Start with the work you need done and the accommodations you can provide. Create an account to take the next step."],
            ["How is Inclusion Revolution involved?", "ConnectAble is an Inclusion Revolution project. The stories shared here come from its community and its work connecting people with opportunities."],
          ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
        </section>
        <section className={styles.finalCta} data-reveal><p className={styles.sectionLabel}>There is more to your story.</p><h2>Let’s find<br />what comes next<span>.</span></h2><Link href="/signup" className={styles.primaryCta}>Find your next step <ArrowUpRight size={23} /></Link><p>For job seekers, employers, and mentors.</p></section>
      </main>
      <footer className={styles.footer}><div><Link href="/" className={styles.wordmark}>ConnectAble<span className={styles.brandDot}>.</span></Link><p>An Inclusion Revolution project.</p></div><nav aria-label="Footer navigation"><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav><p>Every ability. Every possibility.</p></footer>
      <dialog ref={dialog} className={styles.filmDialog} onCancel={closeFilm} onClose={() => { setActiveFilm(null); trigger.current?.focus(); }} aria-labelledby="film-title">
        {film && <div className={styles.filmInner}><div className={styles.filmHeader}><h2 id="film-title">{film.title}</h2><button onClick={closeFilm} aria-label="Close video"><X size={24} /></button></div><video key={film.file} className={film.portrait ? styles.portraitPlayer : styles.landscapePlayer} src={`/stories/${film.file}.mp4`} controls autoPlay playsInline preload="metadata"><track kind="captions" src={`/stories/${film.file}.vtt`} srcLang="en" label="English (auto-generated)" />Your browser does not support video. <a href={`/stories/${film.file}.mp4`}>Open the video</a>.</video><p className={styles.captionNote}>English captions are auto-generated and may contain errors. Use the player’s caption control to turn them on.</p></div>}
      </dialog>
    </div>
  );
}
