/**
 * Consent for saving form drafts on the person's own device.
 *
 * The decision is stored in a real first-party cookie (`connectable.consent`)
 * so it survives a full page close and is readable on the next visit. The
 * cookie is NOT HttpOnly on purpose -- the client-side draft hook reads it to
 * decide whether it may write. The draft *contents* never go in the cookie
 * (see src/lib/use-form-draft.ts); a multi-KB draft would ride on every
 * request. The cookie holds only "granted" or "essential".
 */

export const CONSENT_COOKIE = "connectable.consent";
/** Fired on window when the choice changes, so same-tab listeners can react. */
export const CONSENT_EVENT = "connectable:consent-change";

export type ConsentValue = "granted" | "essential";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

export function readConsentFromCookieString(cookieString: string | null | undefined): ConsentValue | null {
  if (!cookieString) return null;
  for (const part of cookieString.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== CONSENT_COOKIE) continue;
    const value = decodeURIComponent(part.slice(eq + 1).trim());
    return value === "granted" || value === "essential" ? value : null;
  }
  return null;
}

/** Client only. Returns null until the person has made a choice. */
export function getConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  return readConsentFromCookieString(document.cookie);
}

/** Client only. Persists the choice and notifies same-tab listeners. */
export function setConsent(value: ConsentValue): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<ConsentValue>(CONSENT_EVENT, { detail: value }));
}

/** Client only. True once the person has opted in to on-device draft saving. */
export function hasDraftConsent(): boolean {
  return getConsent() === "granted";
}
