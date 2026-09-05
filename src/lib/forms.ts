/**
 * Turns FormData into a plain object for zod. List fields (from ChipPicker
 * hidden inputs or multi-checkboxes) are collected with getAll.
 */
export function formToObject(fd: FormData, listFields: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    if (listFields.includes(key)) continue;
    if (typeof value === "string") out[key] = value;
  }
  for (const key of listFields) {
    out[key] = fd.getAll(key).filter((v): v is string => typeof v === "string");
  }
  return out;
}
