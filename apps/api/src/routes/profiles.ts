import { Hono } from "hono";
import { eq, inArray } from "drizzle-orm";
import { profileSchema, stellarAddressSchema } from "@milevault/shared";
import { db, schema } from "../db/client";

export const profilesRoutes = new Hono();

/** Batch read: GET /v1/profiles?addresses=G...,G... (for rendering both parties) */
profilesRoutes.get("/", async (c) => {
  const list = (c.req.query("addresses") ?? "").split(",").filter(Boolean).slice(0, 50).map((a) => stellarAddressSchema.parse(a));
  if (!list.length) return c.json([]);
  const rows = await db.select().from(schema.profiles).where(inArray(schema.profiles.address, list));
  return c.json(rows);
});

profilesRoutes.get("/:address", async (c) => {
  const address = stellarAddressSchema.parse(c.req.param("address"));
  const row = await db.query.profiles.findFirst({ where: eq(schema.profiles.address, address) });
  return c.json(row ?? { address, name: null, avatar: null });
});

/**
 * Update your own profile.
 * TODO(security): require a wallet-signed message (SEP-53 signMessage) proving ownership of :address.
 */
profilesRoutes.put("/:address", async (c) => {
  const address = stellarAddressSchema.parse(c.req.param("address"));
  const body = profileSchema.parse(await c.req.json());
  const values = { address, name: body.name ?? null, avatar: body.avatar ?? null, updatedAt: new Date() };
  await db.insert(schema.profiles).values(values).onConflictDoUpdate({ target: schema.profiles.address, set: { name: values.name, avatar: values.avatar, updatedAt: values.updatedAt } });
  return c.json(values);
});
