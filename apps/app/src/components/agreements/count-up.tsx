"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/mock";

/** Animated USDC figure — eases from the previous value to the new one (money moving). */
export function CountUp({ value, suffix = " USDC", hidden }: { value: number; suffix?: string; hidden?: boolean }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current, delta = value - start;
    if (!delta || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); from.current = value; return; }
    const t0 = performance.now(), dur = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      setShown(start + delta * e);
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  if (hidden) return <>••••••</>;
  return <>{fmt(shown)}{suffix}</>;
}
