import type { CSSProperties } from "react";
import { ICON_PATHS, type IconName } from "./paths";

/** Design-system icon (prototype's filled icon set). Colour follows `currentColor` unless `color` is set. */
export function Icon({
  name,
  size = 20,
  color,
  className,
  style,
  title,
}: {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <svg
      className={className ? `i ${className}` : "i"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={color ? { color, ...style } : style}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      dangerouslySetInnerHTML={{ __html: (title ? `<title>${title}</title>` : "") + ICON_PATHS[name] }}
    />
  );
}

export type { IconName };
