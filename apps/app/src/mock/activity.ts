import type { IconName } from "@milevault/ui";
import { plural, usd } from "./format";
import { getPerson } from "./people";
import { total } from "./selectors";
import type { MockAgreement, MockEvent, PersonKey } from "./types";

const C = { pri: "#2EBEF2", sub: "#7B7B7B", green: "#00CE5C", amber: "#F0AF30", blue: "#4797F6", purple: "#B36BF2", red: "#FE393B" };

/** Activity row icon (design ACT table) */
export const ACT: Record<string, [IconName, string, string]> = {
  release: ["bill", C.green, "#EBFEF3"],
  fund: ["safe_lock", C.pri, "#EAF8FE"],
  submit: ["flag", C.amber, "#FEFCE6"],
  approve: ["check_circle", C.blue, "#ECF4FE"],
  create: ["file_new", C.purple, "#FAF3FE"],
  accept: ["check_circle", C.blue, "#ECF4FE"],
  decline: ["close_circle", C.sub, "#F5F5F5"],
  cancel: ["close_circle", C.sub, "#F5F5F5"],
  cancel_request: ["time", C.amber, "#FEFCE6"],
  cancel_withdraw: ["refresh", C.blue, "#ECF4FE"],
  refund: ["refresh", C.purple, "#FAF3FE"],
};

/** Transactions page type label/icon (design TXT table) */
export function txType(kind: MockEvent["kind"], incoming: boolean): [string, IconName, string, string] {
  switch (kind) {
    case "release": return [incoming ? "Payment received" : "Release", "transfer", C.green, "#EBFEF3"];
    case "fund": return ["Fund escrow", "safe_lock", C.pri, "#EAF8FE"];
    case "approve": return ["Approve milestone", "check_circle", C.blue, "#ECF4FE"];
    case "create": return ["Create agreement", "file_new", C.pri, "#EAF8FE"];
    case "submit": return ["Submit milestone", "flag", C.amber, "#FEFCE6"];
    case "accept": return ["Accept agreement", "check_circle", C.blue, "#ECF4FE"];
    case "decline": return ["Decline agreement", "close_circle", C.sub, "#F5F5F5"];
    case "cancel": return ["Cancel agreement", "close_circle", C.sub, "#F5F5F5"];
    case "cancel_request": return ["Request cancellation", "time", C.amber, "#FEFCE6"];
    case "cancel_withdraw": return ["Withdraw cancellation", "refresh", C.blue, "#ECF4FE"];
    case "refund": return ["Refund", "refresh", C.purple, "#FAF3FE"];
  }
}

export interface ActivityText {
  title: string;
  /** Sub line, starts with the agreement name where relevant ("Name · …") */
  sub: string;
  /** Transactions page sub line */
  tsub: string;
  /** Money flowing to the viewer */
  incoming: boolean;
  /** Signed amount for the viewer, or undefined */
  signed?: number;
}

export function describe(e: MockEvent, a: MockAgreement, me: PersonKey): ActivityText {
  const you = e.actor === me;
  const who = you ? "You" : getPerson(e.actor).name;
  const cl = getPerson(a.client), k = getPerson(a.contributor);
  const m = e.i !== undefined ? a.ms[e.i] : undefined;
  const n = (e.i ?? 0) + 1;
  const viewerIsClient = a.client === me;
  switch (e.kind) {
    case "create":
      return { title: `${who} created ${a.name}`, sub: `${plural(a.ms.length, "milestone")} · ${usd(total(a))}`, tsub: `${a.name} · ${plural(a.ms.length, "milestone")}`, incoming: false };
    case "fund":
      return viewerIsClient
        ? { title: `You funded escrow with ${usd(e.amount ?? 0)}`, sub: a.name, tsub: `${a.name} · into escrow`, incoming: false, signed: -(e.amount ?? 0) }
        : { title: `${cl.name} funded ${a.name}`, sub: `${a.name} · ${usd(e.amount ?? 0)} locked in escrow for you`, tsub: `${a.name} · by ${cl.name}`, incoming: false, signed: e.amount };
    case "accept":
      return you
        ? { title: `You accepted ${a.name}`, sub: `${a.name} · ${cl.first} can see you’ve started`, tsub: `${a.name} · terms accepted`, incoming: false }
        : { title: `${k.name} accepted ${a.name}`, sub: `${a.name} · Ready to start milestone 1`, tsub: `${a.name} · by ${k.name}`, incoming: false };
    case "decline":
      return { title: `${who} declined ${a.name}`, sub: `${a.name} · ${usd(total(a))} goes back to ${viewerIsClient ? "your wallet" : cl.name}`, tsub: `${a.name} · declined`, incoming: false };
    case "submit":
      return { title: `${who} submitted ${m?.title}`, sub: `${a.name} · Milestone ${n}`, tsub: `${a.name} · Milestone ${n}`, incoming: false };
    case "approve":
      return { title: `${who} approved ${m?.title}`, sub: viewerIsClient ? `${a.name} · Milestone ${n}` : `${a.name} · waiting for release`, tsub: `${a.name} · Milestone ${n}`, incoming: false };
    case "release":
      return viewerIsClient
        ? { title: `Released ${usd(e.amount ?? 0)} to ${k.name}`, sub: `${a.name} · Milestone ${n}`, tsub: `${a.name} · Milestone ${n} · to ${k.name}`, incoming: false, signed: -(e.amount ?? 0) }
        : { title: `You received ${usd(e.amount ?? 0)} from ${cl.name}`, sub: `${a.name} · Milestone ${n}`, tsub: `${a.name} · Milestone ${n} · from ${cl.name}`, incoming: true, signed: e.amount };
    case "cancel":
      return { title: `${who} cancelled ${a.name}`, sub: a.refunded ? `${a.name} · cancelled by both parties` : `${a.name} · Unfunded, nothing to refund`, tsub: `${a.name} · cancelled`, incoming: false };
    case "cancel_request":
      return { title: you ? `You asked to cancel ${a.name}` : `${getPerson(e.actor).name} asked to cancel ${a.name}`, sub: `${a.name} · Waiting for ${you ? "the other side" : "you"} to confirm`, tsub: `${a.name} · cancellation requested`, incoming: false };
    case "cancel_withdraw":
      return { title: `${who} withdrew the cancellation request`, sub: `${a.name} · Agreement continues`, tsub: `${a.name} · cancellation withdrawn`, incoming: false };
    case "refund":
      return viewerIsClient
        ? { title: `${usd(e.amount ?? 0)} refunded to you`, sub: `${a.name} · unreleased escrow returned`, tsub: `${a.name} · back to your wallet`, incoming: true, signed: e.amount }
        : { title: `${usd(e.amount ?? 0)} refunded to ${cl.name}`, sub: `${a.name} · unreleased escrow returned`, tsub: `${a.name} · to ${cl.name}`, incoming: false };
  }
}
