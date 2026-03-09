import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    env_database_url: !!process.env.DATABASE_URL,
    env_database_url_prefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
    timestamp: new Date().toISOString(),
  };

  try {
    const { db } = await import("@/lib/db");
    const { brands } = await import("@/lib/db/schema");
    const result = await db.select().from(brands).limit(1);
    checks.db_connected = true;
    checks.brands_count_sample = result.length;
  } catch (err: unknown) {
    checks.db_connected = false;
    checks.db_error = err instanceof Error ? err.message : String(err);
    checks.db_stack = err instanceof Error ? err.stack?.split("\n").slice(0, 5) : undefined;
  }

  const status = checks.db_connected ? 200 : 500;
  return NextResponse.json(checks, { status });
}
