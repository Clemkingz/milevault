"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DM from "@radix-ui/react-dropdown-menu";
import type { NotificationItem } from "@milevault/api";
import { relTime } from "@milevault/api";
import { Icon } from "@milevault/ui";
import { useNotifications, useReadNotifications } from "@/lib/queries";

export function NotificationRow({ n, onOpen }: { n: NotificationItem; onOpen?: () => void }) {
  const unread = !n.read;
  return (
    <button className={`nrow${unread ? " unread" : ""}`} onClick={onOpen}>
      <span className="ndot" aria-hidden />
      <span className="tx"><b>{n.title || "Update"}</b>{n.message && <small>{n.message}</small>}<em>{relTime(n.createdAt)}{n.reference ? ` · ${n.reference}` : ""}</em></span>
    </button>
  );
}

/** Bell with unread count + dropdown of the latest notifications (GET /notifications) */
export function NotificationBell({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const { data } = useNotifications(8);
  const read = useReadNotifications();
  const unread = data?.unread ?? 0;
  const go = (n: NotificationItem) => { if (!n.read) read.mutate(n.id); if (n.reference) router.push(`/agreements/${n.reference}`); };
  return (
    <DM.Root modal={false}>
      <DM.Trigger asChild>
        <button className={`bell${compact ? " compact" : ""}`} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Icon name="flag" size={18} />
          {unread > 0 && <span className="bdg">{unread > 9 ? "9+" : unread}</span>}
        </button>
      </DM.Trigger>
      <DM.Portal>
        <DM.Content className="menu npanel" align="end" sideOffset={8} collisionPadding={12} style={{ zIndex: 75 }}>
          <div className="nhead"><b>Notifications</b>{unread > 0 && <button className="link" onClick={() => read.mutate(undefined)}>Mark all read</button>}</div>
          {data?.result.length ? data.result.map((n) => <DM.Item key={n.id} asChild onSelect={() => go(n)}><div><NotificationRow n={n} /></div></DM.Item>)
            : <p className="nempty">You’re all caught up.</p>}
          <Link className="nfoot" href="/notifications">See all notifications</Link>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}
