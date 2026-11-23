import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";
import { Icon, type IconName } from "../icons/icon";

/** Design `.btn`: pill, heights 28–44. Variants map to prototype classes. */
export type ButtonVariant = "pri" | "sec" | "tint" | "ghost" | "danger" | "dsoft";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  h?: 28 | 32 | 36 | 40 | 44;
  icon?: IconName;
  iconSize?: number;
  trailingIcon?: IconName;
  /** Shows the design spinner and blocks clicks; keeps the label for layout stability */
  loading?: boolean;
  /** Label while loading, e.g. "Saving…" (defaults to the normal label) */
  loadingText?: ReactNode;
  wide?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "pri",
  h = 40,
  icon,
  iconSize = 18,
  trailingIcon,
  loading,
  loadingText,
  wide,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn("btn", variant, `h${h}`, wide && "w", loading && "is-loading", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Icon name="loading" size={iconSize} className="spin" /> : icon && <Icon name={icon} size={iconSize} />}
      {children !== undefined && children !== null && <span>{loading && loadingText ? loadingText : children}</span>}
      {trailingIcon && !loading && <Icon name={trailingIcon} size={iconSize} />}
    </button>
  );
}
