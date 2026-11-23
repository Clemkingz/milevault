import { VaultLoader } from "@milevault/ui";

/** Route-segment loading UI (code-split navigation) */
export default function Loading() {
  return <div className="scroll"><div className="col"><VaultLoader /></div></div>;
}
