import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

const sql = postgres(env.DATABASE_URL, { max: 10 });
export const db = drizzle(sql, { schema });
export { schema };
