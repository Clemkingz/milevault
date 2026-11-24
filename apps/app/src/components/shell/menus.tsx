"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { Agreement } from "@milevault/api";
import { Icon, type IconName } from "@milevault/ui";
import { can, type AvailableAction } from "@/lib/domain";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { useActions } from "../use-actions";

export function MenuItem({ icon, children, onSelect, red }: { icon: IconName; children: ReactNode; onSelect: () => void; red?: boolean }) {
  return <DM.Item className={red ? "red" : undefined} onSelect={onSelect}><Icon name={icon} size={18} />{children}</DM.Item>;
}
export function Menu({ trigger, children, align = "end", side = "bottom" }: { trigger: ReactNode; children: ReactNode; align?: "start" | "end"; side?: "top" | "bottom" }) {
  return (
    <DM.Root modal={false}>
      <DM.Trigger asChild>{trigger}</DM.Trigger>
      <DM.Portal><DM.Content className="menu" align={align} side={side} sideOffset={6} collisionPadding={12} style={{ zIndex: 75 }}>{children}</DM.Content></DM.Portal>
    </DM.Root>
  );
}
export const Sep = () => <DM.Separator className="sep" />;

export function UserMenuItems() {
  const router = useRouter();
  const { copy } = useActions();
  const address = useSession((s) => s.address);
  const open = useUI((s) => s.open);
  return (
    <>
      <MenuItem icon="wallet" onSelect={() => router.push("/wallets")}>Wallet and balances</MenuItem>
      <MenuItem icon="transfer" onSelect={() => router.push("/transactions")}>Transactions</MenuItem>
      <MenuItem icon="user" onSelect={() => router.push("/settings")}>Settings</MenuItem>
      <MenuItem icon="copy" onSelect={() => address && copy(address)}>Copy my address</MenuItem>
      <Sep />
      <MenuItem icon="exit" red onSelect={() => open({ t: "disconnect" })}>Disconnect</MenuItem>
    </>
  );
}

/** Agreement "⋯" menu — options follow the backend's rules for this wallet's role and status */
export function AgreementMenuItems({ a, onHistory }: { a: Agreement; onHistory: () => void }) {
  const router = useRouter();
  const { copy, explorer, agreementLink } = useActions();
  const open = useUI((s) => s.open);
  const fundHash = a.fundTx?.hash;
  // Buttons follow the guide's availableActions(); the API still enforces every rule.
  const has = (x: AvailableAction) => can(a, x);
  const danger = has("recover") || has("propose_cancel") || has("cancel_unfunded") || has("delete_draft");
  return (
    <>
      {a.status !== "draft" && <MenuItem icon="link" onSelect={() => copy(agreementLink(a.reference), "Agreement link copied")}>Copy agreement link</MenuItem>}
      {fundHash && <MenuItem icon="external" onSelect={() => explorer(fundHash)}>View funding on explorer</MenuItem>}
      {a.status !== "draft" && <MenuItem icon="history" onSelect={onHistory}>Activity</MenuItem>}
      {has("edit_draft") && <MenuItem icon="edit" onSelect={() => router.push(`/agreements/${a.reference}/edit`)}>Edit draft</MenuItem>}
      {danger && <Sep />}
      {has("recover") && <MenuItem icon="refresh" onSelect={() => open({ t: "action", ref: a.reference, kind: "recover" })}>Recover escrow</MenuItem>}
      {has("propose_cancel") && <MenuItem icon="close_circle" red onSelect={() => open({ t: "action", ref: a.reference, kind: "propose_cancel" })}>Propose cancellation</MenuItem>}
      {has("cancel_unfunded") && <MenuItem icon="close_circle" red onSelect={() => open({ t: "confirm", op: "cancel", ref: a.reference })}>Cancel agreement</MenuItem>}
      {has("delete_draft") && <MenuItem icon="delete" red onSelect={() => open({ t: "confirm", op: "delete_draft", ref: a.reference })}>Delete draft</MenuItem>}
    </>
  );
}
