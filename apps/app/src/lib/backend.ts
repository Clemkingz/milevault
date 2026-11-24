"use client";

import { createApi, createMockTransport, httpTransport } from "@milevault/api";
import { env } from "./env";
import { useSession } from "./session";

/**
 * Single API instance. "live" → external MileVault backend; "mock" → in-browser mock backend
 * that answers the same routes with the same shapes (demo mode).
 */
export const mock = env.dataSource === "mock" ? createMockTransport() : null;

export const api = createApi({
  transport: mock ? mock.transport : httpTransport(env.apiUrl),
  getToken: () => useSession.getState().token,
  onUnauthorized: () => useSession.getState().expire(),
});
