import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.sql`SELECT key, value FROM site_settings`;
  const settings: Record<string, string> = {};
  rows.forEach((r) => (settings[r.key] = r.value));

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  for (const [key, value] of Object.entries(body)) {
    await pool.sql`
      INSERT INTO site_settings (key, value) VALUES (${key}, ${String(value)})
      ON CONFLICT (key) DO UPDATE SET value = ${String(value)}
    `;
  }

  return NextResponse.json({ success: true });
}
