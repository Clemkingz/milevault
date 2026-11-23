"use client";

import type { ReactNode } from "react";
import { useScrolled } from "@milevault/ui";

/** Sticky landing nav that gains elevation once the page scrolls */
export function ScrollHeader({ children }: { children: ReactNode }) {
  const ref = useScrolled<HTMLElement>();
  return <header className="lnav" ref={ref}>{children}</header>;
}
