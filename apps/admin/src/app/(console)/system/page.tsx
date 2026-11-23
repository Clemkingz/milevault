import type { Metadata } from "next";
import { SystemStatus } from "./status";

export const metadata: Metadata = { title: "System" };
export default function Page() { return <SystemStatus />; }
