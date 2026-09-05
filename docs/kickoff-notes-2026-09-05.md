# Kickoff notes — 2026-09-05

Raw team notes from the hackathon kickoff, saved verbatim. The design spec
(`docs/design-spec.md`) is the
interpreted, decided version; this file is the source.

---

Titles/ Names: Istiqlal
Ability Passport 3, 5
availabilitypassport.org is available
ConnectAble 4, 5
Colors: Delilah
Not Blue
Green, yellow, purple
Green & White
Coral (pinkish orange)
Take color blindness into account –shades
Features: Mitron
Resume parse feature - helps gain professional understanding and how you are as a person
Have questions to prompt them for specific things
Agent?
A recruiter on the app that works for you all of the time –translator between normal/ broken up language and converts it into something professional
Card that can be shared - QR code with all of your data that is available - NFC card - near field communication
Awards, skills, volunteer hours, education→ whole person concept
Filters from an employer standpoint where they need to find a skillset and location wise
Automatches employers to employees - %
Something interactive → exchange of info back and forth
Provide feedback quickly to each entity
Recruiter that also works for the employer→ will help prepare personal interview questions about personality and soft skills too
Accommodations
User Interface; Riya
Video with headline and past success stories to add credibility (start)
Credit testimonials after
Share their story
Seeing nick’s backstory was very powerful
FAQs
About us → people who built the app and Inclusion Revolution
Call to actions → button to sign up/ Get Started
Find out what’s next/ learn more
Add people like Beaver/ mentors / guardians to the app to guide the employee
Privacy policy
Terms and conditions
Mentor fit
AI agent - voice or chatbot
User database
External communication
Marketing: Maria
Emotional hook
Why Nick?
Create logo
Outreach
Speak to employers→use Beaver’s current connections
Get onto social media
Show that we have an instagram that supports this
Post presentation video on YouTube
TikTok
LinkedIn
Facebook
X
Search engine optimization
Onboard users, speak to employees→ Beaver’s connections
Domain & email
People should get confirmation email when signing up for platform
Outreach to mentors→ people who have worked at RiseUp Cafe?
Literally talking to the audience


Marketing kit- colors, font types, etc
Financial value
Selling the team → how good this team is -in 48 hrs we were able to accomplish so much
Presentation:
Pitch deck
Final product
Interactive AI agent
Demonstrate the SMS agent on the screen
Make it live
Video
Music
First 5 min is a video that plays and does everything beginning to end
Then presenters show up and answer questions & show final deck
Pricing
Lots of stats
You’re building a culture
Emphasize scalability
User Journey
Employer: Maya
Filters
Location
Age
Education
Skills
Accommodations
Remote/ in person
Availability
Insurance
Capability of how much they can make→ salary
Salary cap for both employers and employees
Don’t employers see employee salary cap?
Ethical version of cluely→ scrolling on the screen
Open source version of it on GitHub
Employer profile
Employee: Mitron
Can apply regardless of accommodations?
Start with higher functioning individuals?
Assistive AI tools
Multi-mode→ speaking and typing
Welcome to the platform, lets have a convo
Video interview, captions, and can show skillset like demo of oil change?
Ability to upload files; multiple types
Same filters as employers
salary cap
Automatic matching system
3.Mentor: Riya
Bridge between employee and employer
Volunteer position?
Filters
Background check
Profile
Match employees to mentors
Mentor can control and process profiles and info for employees
See mentees and can easily track their info
Can add skills to his profiles
Recruiters

Reached out to Sarasota Ford
Reached out to employee

---

## Links and terms (from the same message)

Inclusion Revolution website: https://TheInclusionRevolution.org.
The team can also learn more “official” / vetted details about us through TheGivingPartner.org.
Nik’s video (draft): https://next.frame.io/share/b5756d70-72ee-45a5-b6e0-ce7b9ba2c73b/view/37f2f6b1-ff7e-4bf0-882d-afef081f4bd6

Recommended terms to use:
- Accommodations: when describing a need
- Ability: when describing a skillset

## Decisions made after these notes (2026-09-05)

- Product name: **ConnectAble**. **Ability Passport** is the shareable QR/NFC card inside it.
- Stack: Next.js + TypeScript + Tailwind on Vercel, Supabase for auth/database/storage, a conversational voice agent for onboarding and the recruiter, Claude for resume parsing.
- Employees see employer pay ranges; employers never see an employee's number.
- Age and insurance filters dropped; employer "accommodations" reframed as "accommodations we can provide".
