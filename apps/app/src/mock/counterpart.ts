"use client";

import { newHash, usd } from "./format";
import { getPerson } from "./people";
import { actAs, useChain } from "./store";
import { curIdx, otherOf } from "./selectors";
import { useUI } from "./ui";
import type { MockAgreement, PersonKey } from "./types";

const LINKS = ["figma.com/proto/website-v1", "figma.com/proto/website-v2", "github.com/kay/website/releases/v1.0"];

export interface SimAction {
  who: PersonKey;
  label: string;
  sub: string;
  run: () => void;
}

/**
 * Demo panel: what would the OTHER party do next on this agreement?
 * Lets one person walk the whole client ↔ contributor journey.
 */
export function counterpartAction(a: MockAgreement, me: PersonKey): SimAction | null {
  const o = otherOf(a, me);
  const p = getPerson(o);
  const c = useChain.getState();
  const ui = useUI.getState();
  const i = curIdx(a);
  const m = a.ms[i];
  const n = a.ms.length;
  const act = (fn: () => void, msg: string, tone: "success" | "money" | "info" = "info") => () => {
    try { actAs(o, fn); ui.toast(msg, { tone, action: { label: "View", href: `/agreements/${a.id}` } }); }
    catch (e) { ui.toast(`Simulation failed: ${e instanceof Error ? e.message : e}`, { tone: "error" }); }
  };

  if (a.status === "cancel_requested" && a.cancelRequestedBy === me)
    return { who: o, label: `${p.first} confirms the cancellation`, sub: "Unreleased funds go back to the client", run: act(() => c.confirmCancel(a.id, o, newHash()), `${p.first} confirmed. ${a.name} is cancelled.`, "money") };
  if (a.status === "cancel_requested") return null;

  if (a.client === me) {
    // other side = contributor
    if (a.status === "funded")
      return { who: o, label: `${p.first} accepts the agreement`, sub: "Plays the contributor’s part", run: act(() => c.accept(a.id, newHash()), `${p.first} accepted ${a.name}`) };
    if (a.status === "active" && m?.status === "pending")
      return { who: o, label: `${p.first} submits ${m.title}`, sub: `Milestone ${i + 1} of ${n}`, run: act(() => c.submit(a.id, i, LINKS[i] ?? "figma.com/proto/work", "", newHash()), `${p.first} submitted ${m.title} for review`) };
    return null;
  }
  // other side = client
  if (a.status === "created")
    return { who: o, label: `${p.first} funds the escrow`, sub: "Plays the client’s part", run: act(() => c.fund(a.id, newHash()), `${p.first} funded ${a.name}`, "money") };
  if (a.status === "active" && m?.status === "submitted")
    return { who: o, label: `${p.first} approves ${m.title}`, sub: "Plays the client’s part", run: act(() => c.approve(a.id, i, newHash()), `${p.first} approved ${m.title}. Payment comes next.`) };
  if (a.status === "active" && m?.status === "approved")
    return {
      who: o, label: `${p.first} releases ${usd(m.amount)}`, sub: `Milestone ${i + 1} of ${n}`,
      run: () => {
        try { actAs(o, () => c.release(a.id, i, newHash())); ui.open({ t: "received", id: a.id, i }); }
        catch (e) { ui.toast(`Simulation failed: ${e instanceof Error ? e.message : e}`, { tone: "error" }); }
      },
    };
  return null;
}
