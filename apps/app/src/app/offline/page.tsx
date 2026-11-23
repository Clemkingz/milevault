import type { Metadata } from "next";
import { OfflineView } from "./view";

export const metadata: Metadata = { title: "You’re offline" };
export default function Offline() { return <OfflineView />; }
