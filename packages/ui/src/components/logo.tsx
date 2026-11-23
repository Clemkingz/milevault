import { cn } from "../cn";
import { Icon } from "../icons/icon";

/**
 * MileVault logo (design `.logo`): sky rounded tile with the shield-lock mark + wordmark.
 * size "md" = landing nav (28px tile, 17px/600), "sm" = compact (24px tile).
 */
export function Logo({ size = "md", markOnly, className }: { size?: "sm" | "md" | "lg"; markOnly?: boolean; className?: string }) {
  const tile = size === "sm" ? 24 : size === "lg" ? 40 : 28;
  const icon = size === "sm" ? 14 : size === "lg" ? 22 : 16;
  return (
    <span className={cn("logo", className)} aria-label="MileVault">
      <span className="mk" style={{ width: tile, height: tile, borderRadius: Math.round(tile * 0.29) }}>
        <Icon name="safe_lock" size={icon} />
      </span>
      {!markOnly && <span aria-hidden>MileVault</span>}
    </span>
  );
}
