import { z } from "zod";
import { roleSchema } from "@/lib/domain";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; success?: string };

export const signUpSchema = z.object({
  full_name: z.string().trim().min(1, "Please tell us your name.").max(80, "That name is too long."),
  email: z.string().trim().toLowerCase().pipe(z.email("That email doesn't look right.")),
  password: z.string().min(8, "Use at least 8 characters."),
  role: roleSchema,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const logInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("That email doesn't look right.")),
  password: z.string().min(1, "Please enter your password."),
});

/** First message per field, keyed by the field name. */
export function firstFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

const AUTH_MESSAGES: Array<[needle: string, friendly: string]> = [
  ["already registered", "That email is already signed up. Try logging in."],
  ["Invalid login credentials", "That email and password don't match."],
  ["Email not confirmed", "Please confirm your email first. Check your inbox."],
  ["rate limit", "Too many tries. Please wait a minute and try again."],
];

export function friendlyAuthError(message: string): string {
  const hit = AUTH_MESSAGES.find(([needle]) => message.toLowerCase().includes(needle.toLowerCase()));
  return hit ? hit[1] : "Something went wrong. Please try again.";
}
