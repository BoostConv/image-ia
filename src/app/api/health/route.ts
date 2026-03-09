import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    env_database_url: !!process.env.DATABASE_URL,
    env_database_url_prefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
    timestamp: new Date().toISOString(),
  };

  // Test raw postgres connection first
  try {
    const sql = postgres(process.env.DATABASE_URL!, {
      prepare: false,
      connect_timeout: 10,
      max: 1,
    });
    const result = await sql`SELECT 1 as ok`;
    checks.raw_connection = true;
    checks.raw_result = result;
    await sql.end();
  } catch (err: unknown) {
    checks.raw_connection = false;
    checks.raw_error = err instanceof Error ? err.message : String(err);
    checks.raw_code = (err as Record<string, unknown>)?.code;
  }

  // Test Drizzle ORM
  try {
    const { db } = await import("@/lib/db");
    const { brands } = await import("@/lib/db/schema");
    const result = await db.select().from(brands).limit(1);
    checks.db_connected = true;
    checks.brands_count_sample = result.length;
  } catch (err: unknown) {
    checks.db_connected = false;
    checks.db_error = err instanceof Error ? err.message : String(err);
  }

  const status = checks.raw_connection && checks.db_connected ? 200 : 500;
  return NextResponse.json(checks, { status });
}
