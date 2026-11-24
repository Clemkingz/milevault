"use client";

import type { Agreement } from "@milevault/api";
import { Button } from "@milevault/ui";
import { Ill } from "../art";
import { nextCard } from "@/lib/domain";
import { useRunIntent } from "./intents";

/** Design nextAction() card, driven by the backend's `nextAction` + status */
export function NextAction({ a, me, onHistory }: { a: Agreement; me: string; onHistory: () => void }) {
  const card = nextCard(a, me);
  const run = useRunIntent(a, onHistory);
  if (!card) return null;
  return (
    <div className="card next">
      <div className="top"><Ill k={card.k} /><div className="tx"><b>{card.title}</b><p>{card.body}</p></div></div>
      {card.actions.length > 0 && (
        <div className="acts">{card.actions.map((x) => <Button key={x.label} variant={x.variant} h={40} onClick={() => run(x.intent)}>{x.label}</Button>)}</div>
      )}
    </div>
  );
}
