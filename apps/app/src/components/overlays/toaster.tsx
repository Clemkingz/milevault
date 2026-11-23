"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@milevault/ui";
import { useActions } from "../use-actions";
import { shortHash, useUI, type Toast, type ToastTone } from "@/mock";

const TONE: Record<ToastTone, [IconName, string]> = {
  success: ["check_circle", "#00CE5C"],
  money: ["bill", "#2EBEF2"],
  info: ["info", "#2EBEF2"],
  warning: ["alert", "#F0AF30"],
  error: ["close_circle", "#FE393B"],
};

function ToastItem({ t, index }: { t: Toast; index: number }) {
  const dismiss = useUI((s) => s.dismiss);
  const router = useRouter();
  const { explorer } = useActions();
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const left = useRef(t.duration);
  const started = useRef(Date.now());

  const close = () => { setLeaving(true); setTimeout(() => dismiss(t.id), 180); };
  useEffect(() => {
    if (paused) return;
    started.current = Date.now();
    const timer = setTimeout(close, left.current);
    return () => { clearTimeout(timer); left.current -= Date.now() - started.current; };
  }, [paused]); // eslint-disable-line react-hooks/exhaustive-deps

  const [icon, color] = TONE[t.tone];
  return (
    <div
      className={`toast t-${t.tone}${leaving ? " out" : ""}`}
      role={t.tone === "error" ? "alert" : "status"}
      style={{ ["--i" as string]: index, ["--dur" as string]: `${t.duration}ms` }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="t-ic" style={{ color }}><Icon name={icon} size={16} /></span>
      <span className="t-msg">{t.msg}</span>
      {t.hash && <button className="t-hash" onClick={() => explorer(t.hash!)}>{shortHash(t.hash)}<Icon name="external" size={12} /></button>}
      {t.action && <a onClick={() => { close(); router.push(t.action!.href); }}>{t.action.label}</a>}
      <button className="t-x" onClick={close} aria-label="Dismiss notification"><Icon name="close" size={14} /></button>
      <i className={`t-bar${paused ? " paused" : ""}`} style={{ background: color }} />
    </div>
  );
}

/** Design toast (dark pill), with tones, tx hash chip, pause-on-hover countdown and stacking */
export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t, i) => <ToastItem key={t.id} t={t} index={toasts.length - 1 - i} />)}
    </div>
  );
}
