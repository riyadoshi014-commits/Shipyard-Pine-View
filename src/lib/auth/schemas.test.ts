import { describe, expect, it } from "vitest";
import { formToObject } from "@/lib/forms";
import { firstFieldErrors, friendlyAuthError, logInSchema, signUpSchema } from "./schemas";

describe("formToObject", () => {
  it("copies scalar fields and collects list fields with getAll", () => {
    const fd = new FormData();
    fd.append("city", "Sarasota");
    fd.append("abilities", "a");
    fd.append("abilities", "b");
    expect(formToObject(fd, ["abilities"])).toEqual({ city: "Sarasota", abilities: ["a", "b"] });
    expect(formToObject(new FormData(), ["abilities"])).toEqual({ abilities: [] });
  });
});

describe("signUpSchema", () => {
  it("accepts a valid sign up and lowercases the email", () => {
    const r = signUpSchema.safeParse({ full_name: " Nick ", email: "Nick@Example.com", password: "longenough", role: "employee" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual({ full_name: "Nick", email: "nick@example.com", password: "longenough", role: "employee" });
  });

  it("reports one plain-language error per field", () => {
    const r = signUpSchema.safeParse({ full_name: "", email: "nope", password: "short", role: "boss" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errors = firstFieldErrors(r.error);
      expect(errors.full_name).toBe("Please tell us your name.");
      expect(errors.email).toBe("That email doesn't look right.");
      expect(errors.password).toBe("Use at least 8 characters.");
      expect(errors.role).toBeDefined();
    }
  });
});

describe("logInSchema", () => {
  it("requires a password", () => {
    expect(logInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("friendlyAuthError", () => {
  it("maps known messages and falls back", () => {
    expect(friendlyAuthError("User already registered")).toBe("That email is already signed up. Try logging in.");
    expect(friendlyAuthError("Invalid login credentials")).toBe("That email and password don't match.");
    expect(friendlyAuthError("weird")).toBe("Something went wrong. Please try again.");
  });
});
