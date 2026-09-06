/**
 * Landing-page FAQ — single source shared by the rendered <details> list in
 * `story-home.tsx` and the FAQPage JSON-LD in `app/page.tsx` (audit F8), so the
 * two can never drift.
 */
export const FAQ = [
  [
    "Who is ConnectAble for?",
    "Job seekers with intellectual and developmental disabilities, employers who want to hire inclusively, and mentors who support the connection. There’s a place for each of you.",
  ],
  [
    "How do I make an Ability Passport?",
    "Create a job seeker account, then share your abilities, experience, availability, and what helps you work well. Your Passport Guide can help you talk or type through it, one question at a time. You can also fill it in yourself.",
  ],
  [
    "Can someone help me get started?",
    "Yes. You can go through the questions with someone you trust. You can take your time, and you can stop whenever you need to.",
  ],
  [
    "What if I’m an employer or a mentor?",
    "Choose your role when you create an account. Employers can describe the work they need done and the accommodations they can offer. Mentors can help job seekers through the process.",
  ],
] as const;
