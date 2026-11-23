import type { MockAgreement, MockMilestone, PersonKey } from "./types";

export type DisplayState = "awaiting" | "awaitc" | "funded" | "progress" | "cancel_requested" | "completed" | "cancelled" | "declined";

export const total = (a: MockAgreement) => a.ms.reduce((s, m) => s + m.amount, 0);
export const released = (a: MockAgreement) => a.ms.filter((m) => m.status === "paid").reduce((s, m) => s + m.amount, 0);
export const isFunded = (a: MockAgreement) => ["funded", "active", "cancel_requested", "completed"].includes(a.status);
export const isOpen = (a: MockAgreement) => ["created", "funded", "active", "cancel_requested"].includes(a.status);
/** Unreleased funds still held by the contract */
export const locked = (a: MockAgreement) => (isFunded(a) ? total(a) - released(a) : 0);
export const curIdx = (a: MockAgreement) => a.ms.findIndex((m) => m.status !== "paid");
export const paidN = (a: MockAgreement) => a.ms.filter((m) => m.status === "paid").length;
export const roleOf = (a: MockAgreement, me: PersonKey) => (a.client === me ? "client" : "contributor");
export const otherOf = (a: MockAgreement, me: PersonKey) => (a.client === me ? a.contributor : a.client);
export const involves = (a: MockAgreement, me: PersonKey) => a.client === me || a.contributor === me;
export const accepted = (a: MockAgreement) => a.status === "active" || (a.status === "cancel_requested" && a.cancelPrevStatus === "active") || a.status === "completed";

export function agState(a: MockAgreement): DisplayState {
  switch (a.status) {
    case "created": return "awaiting";
    case "funded": return "awaitc";
    case "active": return paidN(a) || a.ms.some((m) => m.status !== "pending") ? "progress" : "funded";
    default: return a.status;
  }
}

export const msActive = (m: MockMilestone) => m.status === "submitted" || m.status === "approved";
