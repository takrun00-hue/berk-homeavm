import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  const envInfo = {
    SUPABASE_HOST: process.env.SUPABASE_HOST || "NOT SET",
    SUPABASE_USER: process.env.SUPABASE_USER || "NOT SET",
    SUPABASE_PORT: process.env.SUPABASE_PORT || "NOT SET",
    SUPABASE_DATABASE: process.env.SUPABASE_DATABASE || "NOT SET",
    SUPABASE_PASSWORD: process.env.SUPABASE_PASSWORD ? `SET (len=${process.env.SUPABASE_PASSWORD.length})` : "NOT SET",
    DATABASE_URL_starts: process.env.DATABASE_URL?.substring(0, 30) || "NOT SET",
    PGUSER: process.env.PGUSER || "NOT SET",
    PGPASSWORD: process.env.PGPASSWORD ? `SET (len=${process.env.PGPASSWORD.length})` : "NOT SET",
    PGHOST: process.env.PGHOST || "NOT SET",
  };

  let dbTest: Record<string, unknown> = { status: "not attempted" };

  if (process.env.SUPABASE_HOST && process.env.SUPABASE_USER && process.env.SUPABASE_PASSWORD) {
    const testPool = new Pool({
      host: process.env.SUPABASE_HOST,
      port: Number(process.env.SUPABASE_PORT) || 6543,
      database: process.env.SUPABASE_DATABASE || "postgres",
      user: process.env.SUPABASE_USER,
      password: process.env.SUPABASE_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 8000,
    });

    try {
      const result = await testPool.query("SELECT current_user, current_database()");
      dbTest = {
        status: "SUCCESS",
        current_user: result.rows[0].current_user,
        current_database: result.rows[0].current_database,
      };
    } catch (err) {
      dbTest = {
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
        code: (err as { code?: string }).code,
      };
    } finally {
      await testPool.end().catch(() => {});
    }
  }

  return NextResponse.json({ env: envInfo, dbTest });
}
