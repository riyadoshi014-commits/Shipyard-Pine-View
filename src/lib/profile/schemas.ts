import { z } from "zod";
import { parseList } from "@/lib/agent/text";
import { remotePreferenceSchema } from "@/lib/domain";

/** Fields that arrive as repeated form values (ChipPicker hidden inputs). */
export const PROFILE_LIST_FIELDS = ["abilities", "accommodations", "availability"];

export const listField = z
  .array(z.string())
  .default([])
  .transform((items) => parseList(items.join(",")));

export const optionalMoney = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.number().min(0, "Pay can't be negative.").max(999999).nullable(),
);

export const employeeProfileFormSchema = z
  .object({
    headline: z.string().trim().max(120, "Keep the headline under 120 characters."),
    city: z.string().trim().max(80),
    state: z.string().trim().toUpperCase().max(2),
    remote_preference: remotePreferenceSchema,
    abilities: listField,
    accommodations: listField,
    availability: listField,
    about: z.string().trim().max(1000, "Keep the story under 1000 characters."),
    about_raw: z.string().trim().max(2000),
    salary_min: optionalMoney,
    salary_max: optionalMoney,
  })
  .transform((v) =>
    v.salary_min != null && v.salary_max != null && v.salary_min > v.salary_max
      ? { ...v, salary_min: v.salary_max, salary_max: v.salary_min }
      : v,
  );
export type EmployeeProfileInput = z.infer<typeof employeeProfileFormSchema>;

export const historyFormSchema = z.object({
  kind: z.enum(["award", "education", "volunteer"]),
  title: z.string().trim().min(1, "Please add a title.").max(120),
  org: z.string().trim().max(120),
  year: z.string().trim().max(20),
  details: z.string().trim().max(300),
});
