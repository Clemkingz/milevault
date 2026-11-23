import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { ZodError } from "zod";
import { env } from "./env";
import { agreementsRoutes } from "./routes/agreements";
import { profilesRoutes } from "./routes/profiles";
import { walletsRoutes } from "./routes/wallets";

export const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()) }));

app.get("/health", (c) => c.json({ ok: true }));
app.route("/v1/agreements", agreementsRoutes);
app.route("/v1/wallets", walletsRoutes);
app.route("/v1/profiles", profilesRoutes);

app.onError((err, c) => {
  if (err instanceof ZodError) return c.json({ error: err.issues[0]?.message ?? "Invalid request" }, 400);
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});
