"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Progressive scroll reveal. Content is visible by default (no-JS, print, crawlers);
 * only blocks that start below the fold are hidden, then rise in when scrolled to.
 * `stagger` cascades direct children.
 */
export function Reveal({ children, className = "", stagger, delay = 0, as: Tag = "div", id }: { children: ReactNode; className?: string; stagger?: boolean; delay?: number; as?: "div" | "section"; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.classList.add("pending");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.classList.remove("pending");
          el.classList.add("revealed");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // @ts-expect-error polymorphic ref
    <Tag ref={ref} id={id} className={`reveal${stagger ? " reveal-stagger" : ""}${className ? ` ${className}` : ""}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}

/** Adds `.scrolled` to an element once the page has scrolled (sticky header elevation). */
export function useScrolled<T extends HTMLElement>(threshold = 4) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => el.classList.toggle("scrolled", window.scrollY > threshold);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [threshold]);
  return ref;
}
