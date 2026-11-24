"use client";

import { ErrorState } from "@/components/bits";
import { Page } from "@/components/shell/page";
import { useAgreement } from "@/lib/queries";
import { AgreementEditor } from "../../editor";

export function EditDraft({ refId }: { refId: string }) {
  const { data, isPending, error, refetch } = useAgreement(refId);
  if (error) return <Page back="/agreements" title="Edit draft"><ErrorState error={error} retry={() => refetch()} /></Page>;
  return <AgreementEditor draft={data} loading={isPending} key={data?.reference ?? "loading"} />;
}
