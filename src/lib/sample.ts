/**
 * Hardcoded sample content for the raw frontend. Every screen reads from
 * here so the UI can be reviewed on Vercel before any backend exists.
 */
import type { EmployerProfile, HistoryItem, Job, RemotePreference } from "@/lib/domain";
import { scoreMatch, type Breakdown } from "@/lib/match/score";

export type SampleEmployee = {
  id: string;
  slug: string;
  fullName: string;
  headline: string;
  about: string;
  aboutRaw: string;
  city: string;
  state: string;
  remotePreference: RemotePreference;
  abilities: string[];
  accommodations: string[];
  availability: string[];
  awards: HistoryItem[];
  education: HistoryItem[];
  volunteer: HistoryItem[];
  salaryMin: number | null;
  salaryMax: number | null;
};

export const ME: SampleEmployee = {
  id: "nick",
  slug: "nick-7k3q",
  fullName: "Nick Alvarez",
  headline: "Friendly team member who loves keeping things organized",
  about:
    "Nick is dependable, upbeat and detail-focused. He kept the stockroom at a busy café running smoothly for two years and is known for greeting every customer by name.",
  aboutRaw:
    "I worked at the cafe and I made sure everything was in the right place. People liked when I said hi to them. I never missed a shift.",
  city: "Sarasota",
  state: "FL",
  remotePreference: "in_person",
  abilities: ["Greeting customers", "Stocking shelves", "Following a checklist", "Being on time", "Working on a team"],
  accommodations: ["Written instructions", "Regular schedule", "Job coach visits"],
  availability: ["Weekday mornings", "Weekday afternoons", "Saturdays"],
  awards: [{ title: "Employee of the Month", org: "Rise Up Café", year: "2025" }],
  education: [{ title: "High school diploma", org: "Booker High School", year: "2022" }],
  volunteer: [{ title: "Food bank helper", org: "All Faiths Food Bank", year: "2023–2024", details: "Sorted and packed donations every Saturday." }],
  salaryMin: 15,
  salaryMax: 18,
};

export const OTHER_EMPLOYEES: SampleEmployee[] = [
  {
    ...ME,
    id: "priya",
    slug: "priya-x2m9",
    fullName: "Priya Nair",
    headline: "Careful, patient and great with animals",
    about: "Priya volunteers at the humane society and thrives on routine tasks done well.",
    aboutRaw: "",
    abilities: ["Caring for animals", "Cleaning and organizing", "Following a checklist"],
    accommodations: ["Quiet workspace", "Visual reminders"],
    availability: ["Weekday mornings", "Sundays"],
    salaryMin: 14,
    salaryMax: 17,
    awards: [],
    education: [{ title: "Certificate in Animal Care", org: "Suncoast Technical College", year: "2024" }],
    volunteer: [{ title: "Kennel assistant", org: "Humane Society of Sarasota", year: "2023–2025" }],
  },
  {
    ...ME,
    id: "marcus",
    slug: "marcus-p4rt",
    fullName: "Marcus Lee",
    headline: "Fast, focused and happy on his feet all day",
    about: "Marcus ran the drive-through line at a coffee cart program and loves a busy morning rush.",
    aboutRaw: "",
    abilities: ["Cash register", "Greeting customers", "Food prep", "Being on time"],
    accommodations: ["Clear step-by-step tasks", "Breaks when needed"],
    availability: ["Weekday mornings", "Weekday afternoons"],
    salaryMin: 16,
    salaryMax: 20,
    awards: [],
    education: [],
    volunteer: [],
  },
  {
    ...ME,
    id: "elena",
    slug: "elena-k8wq",
    fullName: "Elena Rossi",
    headline: "Organized and calm, loves data entry and sorting",
    about: "Elena prefers quiet, structured work and is meticulous with details.",
    aboutRaw: "",
    remotePreference: "either",
    abilities: ["Data entry", "Sorting and packing", "Following a checklist"],
    accommodations: ["Quiet workspace", "Written instructions"],
    availability: ["Weekday afternoons", "Weekday evenings"],
    salaryMin: 15,
    salaryMax: 19,
    awards: [],
    education: [],
    volunteer: [],
  },
  {
    ...ME,
    id: "tyler",
    slug: "tyler-m3nd",
    fullName: "Tyler Brooks",
    headline: "Strong, steady and great outdoors",
    about: "Tyler grew vegetables in a garden-to-market program and likes physical work with a clear plan.",
    aboutRaw: "",
    city: "Bradenton",
    abilities: ["Gardening", "Sorting and packing", "Working on a team"],
    accommodations: ["Regular schedule", "Extra training time"],
    availability: ["Weekday mornings", "Saturdays", "Sundays"],
    salaryMin: 14,
    salaryMax: 16,
    awards: [],
    education: [],
    volunteer: [],
  },
];

export const EMPLOYER: EmployerProfile = {
  user_id: "gulf-coast-auto",
  company_name: "Gulf Coast Auto Group",
  description:
    "Family-owned dealership with a service center, detail bay and café. We have hired through Inclusion Revolution since 2023.",
  website: "https://example.com",
  city: "Sarasota",
  state: "FL",
  accommodations_offered: ["Written instructions", "Regular schedule", "Job coach visits", "Clear step-by-step tasks"],
};

export const JOBS: Job[] = [
  {
    id: "lot-attendant",
    employer_id: EMPLOYER.user_id,
    title: "Lot Attendant",
    description:
      "Keep the front lot looking sharp: park and line up vehicles, wipe down cars, keep the walkways clear and greet customers as they arrive.",
    abilities_required: ["Greeting customers", "Following a checklist", "Being on time", "Cleaning and organizing"],
    city: "Sarasota",
    state: "FL",
    remote: "in_person",
    availability: ["Weekday mornings", "Saturdays"],
    salary_min: 15,
    salary_max: 17,
    accommodations_offered: ["Written instructions", "Regular schedule", "Job coach visits"],
    status: "open",
  },
  {
    id: "service-greeter",
    employer_id: EMPLOYER.user_id,
    title: "Service Greeter",
    description:
      "Welcome customers to the service drive, check them in on a tablet and walk them to the lounge. A warm smile matters most.",
    abilities_required: ["Greeting customers", "Working on a team", "Data entry"],
    city: "Sarasota",
    state: "FL",
    remote: "in_person",
    availability: ["Weekday mornings", "Weekday afternoons"],
    salary_min: 16,
    salary_max: 19,
    accommodations_offered: ["Clear step-by-step tasks", "Breaks when needed", "Regular schedule"],
    status: "open",
  },
];

export type SampleMatch = {
  id: string;
  job: Job;
  employee: SampleEmployee;
  score: number;
  breakdown: Breakdown;
  employerFeedback: "interested" | "not_now" | null;
  employeeFeedback: "interested" | "not_now" | null;
};

function toMatchInput(e: SampleEmployee) {
  return {
    user_id: e.id,
    abilities: e.abilities,
    accommodations: e.accommodations,
    availability: e.availability,
    city: e.city,
    state: e.state,
    remote_preference: e.remotePreference,
  };
}

export const MATCHES: SampleMatch[] = JOBS.flatMap((job) =>
  [ME, ...OTHER_EMPLOYEES].map((employee): SampleMatch => {
    const { score, breakdown } = scoreMatch(
      toMatchInput(employee),
      { salary_min: employee.salaryMin, salary_max: employee.salaryMax },
      job,
    );
    return {
      id: `${job.id}-${employee.id}`,
      job,
      employee,
      score,
      breakdown,
      employerFeedback: job.id === "lot-attendant" && employee.id === "nick" ? "interested" : null,
      employeeFeedback: null,
    };
  }),
).sort((a, b) => b.score - a.score);

export const SITE_URL = "https://www.connectable.work";

export const REMOTE_LABEL: Record<RemotePreference, string> = {
  remote: "Remote",
  in_person: "In person",
  either: "Remote or in person",
};

export const ABILITY_SUGGESTIONS = [
  "Greeting customers",
  "Stocking shelves",
  "Following a checklist",
  "Cleaning and organizing",
  "Food prep",
  "Cash register",
  "Data entry",
  "Sorting and packing",
  "Gardening",
  "Caring for animals",
  "Working on a team",
  "Being on time",
];

export const ACCOMMODATION_SUGGESTIONS = [
  "Written instructions",
  "Quiet workspace",
  "Regular schedule",
  "Extra training time",
  "Job coach visits",
  "Breaks when needed",
  "Visual reminders",
  "Clear step-by-step tasks",
];

export const AVAILABILITY_OPTIONS = ["Weekday mornings", "Weekday afternoons", "Weekday evenings", "Saturdays", "Sundays"];

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];
