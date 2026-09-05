import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-local stand-in for the three tables the Passport Guide writes to
 * (employee_profiles, employee_private, profiles). It speaks the tiny subset
 * of the Supabase client API that src/lib/agent/client-tools.ts uses, so the
 * same tools run unchanged before a database exists. Data lives in
 * localStorage and never leaves the device.
 */

type Row = Record<string, unknown>;
type Tables = Record<string, Record<string, Row>>;

export const LOCAL_STORE_KEY = "connectable.passport.v1";

export type LocalStore = {
  /** Cast-compatible with the subset of SupabaseClient the tools call. */
  client: SupabaseClient;
  read(): Tables;
  row(table: string, id: string): Row | null;
  reset(): void;
  subscribe(listener: () => void): () => void;
};

function load(storage: Storage | null): Tables {
  try {
    const raw = storage?.getItem(LOCAL_STORE_KEY);
    return raw ? (JSON.parse(raw) as Tables) : {};
  } catch {
    return {};
  }
}

export function createLocalStore(
  storage: Storage | null = typeof window === "undefined" ? null : window.localStorage,
): LocalStore {
  let tables = load(storage);
  const listeners = new Set<() => void>();

  const table = (name: string) => (tables[name] ??= {});
  const persist = () => {
    try {
      storage?.setItem(LOCAL_STORE_KEY, JSON.stringify(tables));
    } catch {
      // Private mode or full storage: keep working in memory.
    }
    listeners.forEach((l) => l());
  };

  const client = {
    from(name: string) {
      return {
        select: () => ({
          eq: (_column: string, id: string) => ({
            maybeSingle: async () => ({ data: table(name)[id] ?? null, error: null }),
          }),
        }),
        upsert: async (row: Row) => {
          const id = String(row.user_id);
          table(name)[id] = { ...(table(name)[id] ?? {}), ...row };
          persist();
          return { error: null };
        },
        update: (patch: Row) => ({
          eq: async (_column: string, id: string) => {
            if (typeof patch.passport_slug === "string") {
              const taken = Object.entries(table(name)).some(
                ([rid, r]) => rid !== id && r.passport_slug === patch.passport_slug,
              );
              if (taken) return { error: { message: "duplicate key value violates unique constraint" } };
            }
            table(name)[id] = { ...(table(name)[id] ?? {}), ...patch };
            persist();
            return { error: null };
          },
        }),
      };
    },
  } as unknown as SupabaseClient;

  return {
    client,
    read: () => tables,
    row: (name, id) => table(name)[id] ?? null,
    reset: () => {
      tables = {};
      persist();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
