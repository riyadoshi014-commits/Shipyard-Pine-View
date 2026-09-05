import { z } from "zod";

/** Shared value types and validators. Keep in step with supabase/migrations. */

export const ROLES = ["employee", "employer", "mentor"] as const;
export type Role = (typeof ROLES)[number];
export const roleSchema = z.enum(ROLES);

export const REMOTE_PREFERENCES = ["remote", "in_person", "either"] as const;
export type RemotePreference = (typeof REMOTE_PREFERENCES)[number];
export const remotePreferenceSchema = z.enum(REMOTE_PREFERENCES);

export const HISTORY_KINDS = ["award", "education", "volunteer"] as const;
export type HistoryKind = (typeof HISTORY_KINDS)[number];

export const historyItemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  org: z.string().trim().max(120).optional(),
  year: z.string().trim().max(20).optional(),
  details: z.string().trim().max(300).optional(),
});
export type HistoryItem = z.infer<typeof historyItemSchema>;

export const employeeProfileSchema = z.object({
  user_id: z.string().uuid(),
  headline: z.string(),
  about: z.string(),
  about_raw: z.string(),
  city: z.string(),
  state: z.string(),
  remote_preference: remotePreferenceSchema,
  availability: z.array(z.string()),
  abilities: z.array(z.string()),
  accommodations: z.array(z.string()),
  awards: z.array(historyItemSchema),
  education: z.array(historyItemSchema),
  volunteer: z.array(historyItemSchema),
  resume_path: z.string().nullable(),
  video_path: z.string().nullable(),
  passport_slug: z.string().nullable(),
  passport_public: z.boolean(),
  searchable: z.boolean(),
});
export type EmployeeProfile = z.infer<typeof employeeProfileSchema>;

export type EmployerProfile = {
  user_id: string;
  company_name: string;
  description: string;
  website: string | null;
  city: string;
  state: string;
  accommodations_offered: string[];
};

export type Job = {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  abilities_required: string[];
  city: string;
  state: string;
  remote: RemotePreference;
  availability: string[];
  salary_min: number | null;
  salary_max: number | null;
  accommodations_offered: string[];
  status: "open" | "closed";
};

export type FeedbackValue = "interested" | "not_now";

export const employeePrivateSchema = z.object({
  user_id: z.string().uuid(),
  salary_min: z.number().nullable(),
  salary_max: z.number().nullable(),
});
export type EmployeePrivate = z.infer<typeof employeePrivateSchema>;
