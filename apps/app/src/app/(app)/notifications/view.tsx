"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@milevault/ui";
import { Empty, ErrorState, PageHeader, Pager } from "@/components/bits";
import { Page } from "@/components/shell/page";
import { RowsSkeleton } from "@/components/shell/skeleton";
import { NotificationRow } from "@/components/shell/notifications";
import { api } from "@/lib/backend";
import { useReadNotifications } from "@/lib/queries";

/** GET /notifications (+ read / read-all) */
export function NotificationsView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isPending, error, refetch } = useQuery({ queryKey: ["notifications", "page", page], queryFn: () => api.overview.notifications({ limit: 20, offset: (page - 1) * 20 }) });
  const read = useReadNotifications();
  return (
    <Page title="Notifications">
      <PageHeader title="Notifications" sub="Funding, submissions, approvals, payments and cancellations on your agreements." actions={data?.unread ? <Button variant="sec" h={40} icon="check" loading={read.isPending} onClick={() => read.mutate(undefined, { onSuccess: () => refetch() })}>Mark all read</Button> : undefined} />
      {isPending ? <RowsSkeleton rows={5} /> : error ? <ErrorState error={error} retry={() => refetch()} /> : data!.result.length ? (
        <>
          <div className="card nlist mv-list">
            {data!.result.map((n) => <NotificationRow key={n.id} n={n} onOpen={() => { if (!n.read) read.mutate(n.id, { onSuccess: () => refetch() }); if (n.reference) router.push(`/agreements/${n.reference}`); }} />)}
          </div>
          <Pager meta={data!.paginationMeta} page={page} onPage={setPage} />
        </>
      ) : <Empty k="E-03" title="No notifications" body="You’ll see updates here when something happens on your agreements." />}
    </Page>
  );
}
