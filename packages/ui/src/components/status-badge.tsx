import { cn } from "../cn";
import { Icon, type IconName } from "../icons/icon";

const C = { pri: "#2EBEF2", sub: "#7B7B7B", soft: "#A3A3A3", green: "#00CE5C", amber: "#F0AF30", blue: "#4797F6", red: "#FE393B" };

/** Design BADGE table (label, icon, icon colour) */
export const BADGES = {
  pending: ["Pending", "time", C.sub],
  submitted: ["Submitted", "flag", C.amber],
  approved: ["Approved", "check_circle", C.blue],
  paid: ["Paid", "check_circle", C.green],
  awaiting: ["Awaiting funding", "time", C.amber],
  awaitc: ["Awaiting contributor", "time", C.blue],
  funded: ["Funded", "safe_lock", C.pri],
  progress: ["In progress", "loading", C.blue],
  cancel_requested: ["Cancel requested", "time", C.amber],
  completed: ["Completed", "check_circle", C.green],
  cancelled: ["Cancelled", "close_circle", C.soft],
  declined: ["Declined", "close_circle", C.soft],
  draft: ["Draft", "edit", C.soft],
  confirmed: ["Confirmed", "check_circle", C.green],
  connected: ["Connected", "check_circle", C.green],
  processing: ["Processing", "loading", C.blue],
  failed: ["Failed", "close_circle", C.red],
} as const satisfies Record<string, readonly [string, IconName, string]>;

export type BadgeKind = keyof typeof BADGES;

export function StatusBadge({ status, iconOnly, className }: { status: BadgeKind; iconOnly?: boolean; className?: string }) {
  const [label, icon, color] = BADGES[status];
  return (
    <span className={cn("badge", iconOnly && "icononly", className)} title={label}>
      <Icon name={icon} size={16} color={color} className={icon === "loading" ? "spin" : undefined} />
      {!iconOnly && label}
    </span>
  );
}
