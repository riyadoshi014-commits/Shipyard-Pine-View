import { describe, expect, it } from "vitest";
import { buildPassportClientTools } from "./client-tools";
import { createLocalStore, LOCAL_STORE_KEY } from "./local-store";

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

const opts = { siteUrl: "https://connectable.test", fullName: "Nick Alvarez" };

describe("local store with the Passport client tools", () => {
  it("persists tool writes to storage and notifies subscribers", async () => {
    const storage = fakeStorage();
    const store = createLocalStore(storage);
    let notified = 0;
    store.subscribe(() => notified++);
    const tools = buildPassportClientTools(store.client, "local-user", opts);

    const reply = await tools.save_abilities({ abilities: "stocking shelves, greeting customers" });
    expect(reply).toMatch(/^Saved\. Saved: abilities\./);
    expect(notified).toBe(1);
    expect(JSON.parse(storage.getItem(LOCAL_STORE_KEY)!).employee_profiles["local-user"].abilities).toEqual([
      "stocking shelves",
      "greeting customers",
    ]);
  });

  it("reloads what was saved and keeps pay in employee_private", async () => {
    const storage = fakeStorage();
    const tools = buildPassportClientTools(createLocalStore(storage).client, "u", opts);
    await tools.save_salary({ salary_min: 20, salary_max: 15 });
    const reopened = createLocalStore(storage);
    expect(reopened.row("employee_private", "u")).toMatchObject({ salary_min: 15, salary_max: 20 });
    expect(reopened.row("employee_profiles", "u")).toBeNull();
  });

  it("publishes through finish_onboarding once basics and abilities exist", async () => {
    const store = createLocalStore(fakeStorage());
    const tools = buildPassportClientTools(store.client, "u", opts);
    expect(await tools.finish_onboarding({})).toMatch(/^Error: basics and abilities/);
    await tools.save_basics({ headline: "Friendly team member", city: "Sarasota", state: "fl" });
    await tools.save_abilities({ abilities: "teamwork" });
    const reply = await tools.finish_onboarding({});
    expect(reply).toMatch(/^Published\. The Passport link is https:\/\/connectable\.test\/p\/nick-[a-z0-9]{4}$/);
    expect(store.row("employee_profiles", "u")).toMatchObject({ passport_public: true, searchable: true, state: "FL" });
  });

  it("works in memory when storage is unavailable", async () => {
    const store = createLocalStore(null);
    const tools = buildPassportClientTools(store.client, "u", opts);
    expect(await tools.save_availability({ availability: "Saturdays" })).toMatch(/^Saved\./);
    expect(store.row("employee_profiles", "u")).toMatchObject({ availability: ["Saturdays"] });
  });
});
