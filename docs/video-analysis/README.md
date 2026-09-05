# What these stories ask of ConnectAble

The strongest emotional thread is **having a place in other people's everyday lives**. Employment opens that door through work, a routine, a paycheck, colleagues, and the chance to be known. A homepage should make those experiences tangible before asking anyone to create a profile.

## How this was examined

All three distinct films were submitted to `gemini-3.8-flash` through the Gemini Interactions API with `processing: "agentic"`. The response contains **14 processing calls and 14 processing results**, confirming that agentic processing actually ran. See `gemini-provenance.json` and the reproducible `analyze_gemini.py` script.

I also inspected extracted frames, checked the final sequence more closely, and compared Gemini's dialogue findings with independent local faster-whisper transcripts. This is an editorial interpretation of supplied footage, not a claim to know the participants' inner feelings. Timestamps below are approximate editorial locators.

The input folder contains three distinct stories with alternate encodings:

| Story | Analyzed source | Other copy |
| --- | --- | --- |
| Nick's Story: The Drive to Include | `nick_video_720p.mp4`, 3:08 | `Inclusion Revolution-Shipyard-Nick Video_2026.mp4`, 1080p |
| Adam interview | `IMG_0162.mp4`, 0:30 | `IMG_0162.mov` |
| Card-table moment | `IMG_1277.mp4`, 0:11 | `IMG_1277.mov` |

## Nick: the emotion is earned through ordinary detail

**The opening gives Nick the first word.** He introduces himself and his work while the film shows morning routines: blinds, the kitchen, getting ready. Those familiar actions let a viewer recognize a person and a day before hearing an organizational explanation. The stillness and domestic setting give the later workplace scenes somewhere to grow from.

**The obstacle enters after we meet him.** Around 0:26–0:44, Beaver Shriver describes restricted opportunities. The sequence matters: Nick has already been presented as someone with a life, purpose, and a job. That makes the lack of opportunity legible as a problem in the surrounding world.

**The practical work makes the praise credible.** Across roughly 0:45–1:25, we see the dealership, keys, vehicles, refueling, and care in preparing cars. Later shots show detailing and paperwork. These details give substance to colleagues' comments about his consistency and ability. Use the work footage alongside the testimony; a quote floating alone over a generic portrait would lose that connection.

**The emotional turn is the description of support and companionship.** Around 1:15–1:41, the interview describes an opportunity to do work he enjoys and a team that supports him. The remark about no longer having a job coach belongs to this particular story. It should never become a universal expectation that people must outgrow accommodations or formal support.

Around **1:42–2:12**, Veronica and Jordan describe chatting in the car, lunch, listening to music, and learning what Nick likes. This is the section I would give the most room. Small shared activities make belonging visible. A viewer can recognize the difference between being placed somewhere and becoming someone's colleague.

**The closing praise is specific and reciprocal.** Around 2:13–2:38, colleagues discuss how well Nick does the work and how quickly he learned. Around 2:38–2:47, Nick says, “Doing my job is fun,” and thanks Beaver. Kevin's closing remarks include, “Nick is by far the best in my opinion.” Keeping “in my opinion” preserves the statement as a colleague's appraisal.

The final work, driving, and doorway images echo the opening's everyday routine. They connect the job to a larger life. They do not establish who owns the home, who lives there, or how housing is funded.

The film's score and deliberate editing support this arc. Gemini characterizes the score as acoustic and gentle; I have not independently verified its exact instrumentation. The page should preserve the original soundtrack rather than adding another emotional score over it.

## Adam: personality lives in the particulars

Adam identifies his workplace as The Cheesecake Factory. His Florida Studio Theatre shirt does not establish where the interview was filmed or where he currently works.

The interview moves through concrete details: proximity to The Haven, folding napkins and handling silverware, dinner, a cheesecake discount, earning money, and the people there. At roughly **0:12–0:18**, the question about cheesecake gets a precise answer: “I get free dinner, that's it, but the cheesecake is 25% off.” The specificity gives the exchange warmth and humor. There is no need to embellish it.

His closing description of the people and the workplace makes the clip more than a list of tasks. It tells us which details he chooses to mention. The simple framing and ordinary room sound let his words carry the moment. Keep the interviewer's question with his response so the exchange stays intelligible.

This suggests a product that asks what matters to a person in practical terms: travel, hours, people, preferred work, support, and pay. It also suggests that we should preserve their own words alongside any polished profile summary.

## The card clip: give attention without inventing a biography

The short clip shows a person looking closely at trading cards and handling protective sleeves at a table. The off-camera question and the answer “Cards” make it a small encounter rather than a silent demonstration.

Its emotional contribution is attention: we are invited to spend a few seconds looking at something that occupies this person. We do not need to supply a dramatic backstory to make that worthwhile.

The name heard by Gemini is uncertain, so the homepage does not name the person. The footage does not establish employment, wages, a formal assessment, endurance, or suitability for a particular occupation. It can motivate an optional way to share interests or demonstrate an activity in an Ability Passport. It cannot justify an automated capability rating.

## What I accepted and rejected from Gemini's report

The raw generated report is preserved as `gemini-emotional-reading.md`. Its detailed scene navigation and cross-checking of dialogue were useful. Its conclusions still required editorial review.

I did **not** adopt its claims about the card subject's “task stamina,” generalized performance comparisons with neurotypical people, presumed intentions behind the interviewer's question, or Nick's “complete domestic independence.” These exceed the evidence. Nor should a person's value be made contingent on exceptional productivity. Colleagues can value excellent work while the platform treats every participant with dignity.

## The homepage built from this reading

- **Visual thesis:** warm paper, deep green, and real workplace footage, with generous space for people and their words.
- **Content plan:** Nick and his team in the first viewport; the full story on request; a closer look at his work; Adam and the card-table moment; a short explanation of ConnectAble; clear next steps.
- **Interaction thesis:** a gentle entrance, a sticky story introduction on desktop, and restrained video-button transitions. Reduced-motion preferences disable the effects.

The opening promise is **“A job is a beginning. Belonging is what comes next.”** Nick's image and full film give that line its meaning. All three films open on request with native playback controls, optional English auto-generated captions, keyboard dismissal, and focus restored to the opening button. Videos are not fetched into players until selected. Portrait clips retain portrait playback.

The card clip is framed as a personal moment, not a placement success. The page uses no invented statistics or fabricated testimonials. The real soundtrack and conversation remain intact.

This work builds the **public homepage**, not the entire hiring application. Existing signup, onboarding, and other unfinished routes remain separate work. Captions are drafts generated from local ASR and clearly labeled; they need human review before being treated as final accessibility transcripts. Browser visual QA was unavailable in this session; build, type, lint, and component checks are recorded separately in the task response.

The main design risk is turning a particular person's life into interchangeable feel-good content. Preserve names where verified, concrete actions, ordinary humor, support choices, and each speaker's own account. The people are the reason to build the platform.
