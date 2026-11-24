"use client";

import { useRouter } from "next/navigation";
import type { Agreement } from "@milevault/api";
import type { Intent } from "@/lib/domain";
import { useUI } from "@/lib/ui";
import { useActions } from "../use-actions";

/** Execute a domain intent (open the right dialog, navigate, copy…) */
export function useRunIntent(a: Pick<Agreement, "reference">, onHistory?: () => void) {
  const router = useRouter();
  const open = useUI((s) => s.open);
  const { copy, agreementLink, openExternal } = useActions();
  return (i: Intent) => {
    switch (i.type) {
      case "action": return open({ t: "action", ref: a.reference, kind: i.kind, position: i.position });
      case "confirm": return open({ t: "confirm", op: i.op, ref: a.reference, position: i.position });
      case "edit": return router.push(`/agreements/${a.reference}/edit`);
      case "copy": return copy(agreementLink(a.reference), "Agreement link copied");
      case "history": return onHistory?.();
      case "open": return openExternal(i.url);
    }
  };
}
