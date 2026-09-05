import { Briefcase, HandHeart, User } from "lucide-react";
import type { Role } from "@/lib/domain";

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Job seeker",
  employer: "Employer",
  mentor: "Mentor",
};

const ROLE_STYLE: Record<Role, { className: string; Icon: typeof User }> = {
  employee: { className: "bg-role-employee-soft text-role-employee", Icon: User },
  employer: { className: "bg-role-employer-soft text-role-employer", Icon: Briefcase },
  mentor: { className: "bg-role-mentor-soft text-coral-foreground", Icon: HandHeart },
};

/** Role chip. Colour is decorative; the icon and text carry the meaning. */
export function RoleBadge({ role }: { role: Role }) {
  const { className, Icon } = ROLE_STYLE[role];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${className}`}>
      <Icon aria-hidden="true" className="size-4" />
      {ROLE_LABELS[role]}
    </span>
  );
}
