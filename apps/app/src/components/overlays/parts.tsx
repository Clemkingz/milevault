"use client";

import { walletIcon } from "@/lib/wallet";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { Button, Icon, type ButtonVariant } from "@milevault/ui";
import { imgUrl } from "../art";

/** Design `heroMedia()`: sky + balloon illustration header */
export function HeroMedia({ k, err, closable = true }: { k?: string; err?: boolean; closable?: boolean }) {
  return (
    <div className="hmedia">
      <img className="sky" src={imgUrl(err ? "BG-sunset2" : "sky")} alt="" />
      {k && <><img className="hil" src={imgUrl(k)} alt="" /><span className="knot" /></>}
      {closable && (
        <Dialog.Close className="x" aria-label="Close"><Icon name="close_line" size={16} /></Dialog.Close>
      )}
    </div>
  );
}

export function Head({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="dtx">
      <Dialog.Title asChild><h3>{title}</h3></Dialog.Title>
      <Dialog.Description asChild><p>{children}</p></Dialog.Description>
    </div>
  );
}

export function Foot({ children }: { children: ReactNode }) {
  return <div className="foot">{children}</div>;
}

export function FB({ v = "sec", onClick, children, disabled, loading }: { v?: ButtonVariant; onClick?: () => void; children: ReactNode; disabled?: boolean; loading?: boolean }) {
  return <Button variant={v} h={44} onClick={onClick} disabled={disabled} loading={loading}>{children}</Button>;
}

/** Hero dialog body (illustration header) */
export function HeroDlg({ k, err, closable = true, className, children }: { k?: string; err?: boolean; closable?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={`dlg hero${className ? ` ${className}` : ""}`}>
      <div className="handle"><i /></div>
      <HeroMedia k={k} err={err} closable={closable} />
      {children}
    </div>
  );
}

/** Balloon dialog body (small illustration + close) */
export function BallDlg({ k, head, children }: { k: string; head: ReactNode; children: ReactNode }) {
  return (
    <div className="dlg">
      <div className="handle"><i /></div>
      <div className="dh">
        <div className="dtop">
          <div className="ill b44"><img src={imgUrl(k)} alt="" /></div>
          <Dialog.Close className="xs" aria-label="Close"><Icon name="close" size={16} /></Dialog.Close>
        </div>
        {head}
      </div>
      {children}
    </div>
  );
}

export function WalletRow({ name, label, sub, right, active, muted, onClick }: { name: string; label?: string; sub?: ReactNode; right?: ReactNode; active?: boolean; muted?: boolean; onClick?: () => void }) {
  return (
    <button className={`wopt${active ? " act" : ""}${muted ? " muted" : ""}`} onClick={onClick} type="button">
      <img className="lg" src={imgUrl(walletIcon(name))} alt="" />
      <span className="tx"><b>{label ?? name}</b>{sub}</span>
      {right}
    </button>
  );
}

export function Burst() {
  const colors = ["#2EBEF2", "#00CE5C", "#F0AF30", "#4797F6", "#B36BF2"];
  return (
    <div className="burst" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => {
        const ang = (i / 14) * Math.PI * 2;
        const r = 70 + (i % 3) * 22;
        return <i key={i} style={{ background: colors[i % colors.length], ["--dx" as string]: `${Math.cos(ang) * r}px`, ["--dy" as string]: `${Math.sin(ang) * r * 0.7}px`, animationDelay: `${(i % 4) * 0.04}s` }} />;
      })}
    </div>
  );
}
