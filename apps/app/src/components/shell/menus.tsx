"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@milevault/ui";
import { useActions } from "../use-actions";
import { getPerson, useChain, useUI, type MockAgreement } from "@/mock";

export function MenuItem({ icon, children, onSelect, red }: { icon: IconName; children: ReactNode; onSelect: () => void; red?: boolean }) {
  return (
    <DM.Item className={red ? "red" : undefined} onSelect={onSelect}>
      <Icon name={icon} size={18} />
      {children}
    </DM.Item>
  );
}

export function Menu({ trigger, children, align = "end", side = "bottom" }: { trigger: ReactNode; children: ReactNode; align?: "start" | "end"; side?: "top" | "bottom" }) {
  return (
    <DM.Root modal={false}>
      <DM.Trigger asChild>{trigger}</DM.Trigger>
      <DM.Portal>
        <DM.Content className="menu" align={align} side={side} sideOffset={6} collisionPadding={12} style={{ zIndex: 75 }}>
          {children}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}

export const Sep = () => <DM.Separator className="sep" />;

/** Wallet menu (sidebar user chip / mobile wallet chip) */
export function UserMenuItems() {
  const router = useRouter();
  const { copy } = useActions();
  const me = useChain((s) => s.me);
  const open = useUI((s) => s.open);
  return (
    <>
      <MenuItem icon="user" onSelect={() => router.push("/settings")}>Profile & settings</MenuItem>
      <MenuItem icon="wallet" onSelect={() => router.push("/wallets")}>Wallets and balances</MenuItem>
      <MenuItem icon="transfer" onSelect={() => router.push("/transactions")}>Transactions</MenuItem>
      <MenuItem icon="copy" onSelect={() => me && copy(getPerson(me).addr)}>Copy my address</MenuItem>
      <Sep />
      <MenuItem icon="exit" red onSelect={() => open({ t: "disconnect" })}>Disconnect</MenuItem>
    </>
  );
}

/** Agreement "⋯" menu */
export function AgreementMenuItems({ a, onHistory }: { a: MockAgreement; onHistory: () => void }) {
  const { copy, explorer, agreementLink } = useActions();
  const me = useChain((s) => s.me)!;
  const startTx = useUI((s) => s.startTx);
  const canRequestCancel = (a.status === "funded" || a.status === "active") && (a.client === me || a.contributor === me);
  return (
    <>
      <MenuItem icon="link" onSelect={() => copy(agreementLink(a.id), "Agreement link copied")}>Copy agreement link</MenuItem>
      {a.fundHash && <MenuItem icon="external" onSelect={() => explorer(a.fundHash!)}>View funding on explorer</MenuItem>}
      <MenuItem icon="history" onSelect={onHistory}>Payment history</MenuItem>
      {(canRequestCancel || (a.client === me && a.status === "created")) && <Sep />}
      {canRequestCancel && <MenuItem icon="close_circle" red onSelect={() => startTx("request_cancel", { id: a.id })}>Request cancellation</MenuItem>}
      {a.client === me && a.status === "created" && <MenuItem icon="close_circle" red onSelect={() => startTx("cancel", { id: a.id })}>Cancel agreement</MenuItem>}
    </>
  );
}
