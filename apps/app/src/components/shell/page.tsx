"use client";

import type { ReactNode } from "react";
import { MobileTop } from "./mobile";

/** Page frame: mobile top bar + centred 700px column with staggered entrance */
export function Page({ children, title, back, right, className }: { children: ReactNode; title?: string; back?: string; right?: ReactNode; className?: string }) {
  return (
    <>
      <MobileTop title={title} back={back} right={right} />
      <div className="scroll">
        <main id="main" className={`col mv-page${className ? ` ${className}` : ""}`}>{children}</main>
      </div>
    </>
  );
}
