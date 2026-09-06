import { z } from "zod";
import { remotePreferenceSchema } from "@/lib/domain";
import { listField, optionalMoney } from "@/lib/profile/schemas";

export const EMPLOYER_LIST_FIELDS = ["accommodations_offered"];

export const employerProfileFormSchema = z.object({
  full_name: z.string().trim().min(1, "Please tell us your name.").max(80, "That name is too long."),
  company_name: z.string().trim().min(1, "Please add your company name.").max(120),
  description: z.string().trim().max(1000, "Keep it under 1000 characters."),
  website: z
    .string()
    .trim()
    .max(200)
    .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v)),
  city: z.string().trim().max(80),
  state: z.string().trim().toUpperCase().max(2),
  accommodations_offered: listField,
});

export const JOB_LIST_FIELDS = ["abilities_required", "accommodations_offered", "availability"];

export const jobFormSchema = z
  .object({
    id: z.string().trim().optional().transform((v) => v || undefined),
    title: z.string().trim().min(1, "Please add a job title.").max(120),
    description: z.string().trim().max(2000, "Keep it under 2000 characters."),
    abilities_required: listField.refine((l) => l.length > 0, "Pick at least one ability."),
    accommodations_offered: listField,
    availability: listField,
    city: z.string().trim().max(80),
    state: z.string().trim().toUpperCase().max(2),
    remote: remotePreferenceSchema,
    salary_min: optionalMoney,
    salary_max: optionalMoney,
    status: z.enum(["open", "closed"]).default("open"),
  })
  .transform((v) =>
    v.salary_min != null && v.salary_max != null && v.salary_min > v.salary_max
      ? { ...v, salary_min: v.salary_max, salary_max: v.salary_min }
      : v,
  );
export type JobInput = z.infer<typeof jobFormSchema>;
