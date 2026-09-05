import { Label } from "@/components/ui/label";

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-base font-bold">
        {label}
      </Label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-bold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Spread onto the input inside a Field so errors and hints are announced. */
export function fieldAria(id: string, opts: { hint?: boolean; error?: string }) {
  const describedBy = [opts.hint ? `${id}-hint` : null, opts.error ? `${id}-error` : null].filter(Boolean).join(" ");
  return {
    "aria-invalid": opts.error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  } as const;
}
