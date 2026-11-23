import type { IconName } from "@milevault/ui";

export type NavItem = [href: string, label: string, icon: IconName];

/** Main navigation (tab bar uses the first four) */
export const NAVS: NavItem[] = [
  ["/dashboard", "Dashboard", "home"],
  ["/agreements", "Agreements", "file"],
  ["/transactions", "Transactions", "transfer"],
  ["/wallets", "Wallets", "wallet"],
];

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Workspace", items: [NAVS[0]!, NAVS[1]!, NAVS[2]!] },
  { label: "Account", items: [NAVS[3]!, ["/settings", "Settings", "user"]] },
];

export const navOn = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/agreements": "Agreements",
  "/transactions": "Transactions",
  "/wallets": "Wallets",
  "/settings": "Settings",
};
