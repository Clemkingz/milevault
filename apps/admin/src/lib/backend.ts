"use client";

import { QueryClient } from "@tanstack/react-query";
import { ApiError, createApi, createMockTransport, httpTransport } from "@milevault/api";
import { env } from "./env";
import { useSession } from "./session";

/** "live" → external MileVault backend; "mock" → in-browser mock backend (same routes and shapes). */
export const mock = env.dataSource === "mock" ? createMockTransport() : null;

export const api = createApi({
  transport: mock ? mock.transport : httpTransport(env.apiUrl),
  getToken: () => useSession.getState().token,
  onUnauthorized: () => useSession.getState().expire(),
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      retry: (n, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && n < 2,
    },
  },
});
