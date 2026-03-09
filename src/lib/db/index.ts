import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Please set it in .env.local or Vercel env vars."
  );
}

const client = postgres(connectionString, {
  prepare: false, // required for Supabase Transaction pooler
  connect_timeout: 10,
  idle_timeout: 20,
  max: 10,
});

export const db = drizzle(client, { schema });
