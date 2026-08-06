import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  try {
    const { rows } = await pool.sql`
      SELECT key, value FROM site_settings
    `;

    const settings: Record<string, string> = {};
    rows.forEach((r) => (settings[r.key] = r.value));

    return NextResponse.json(
      { settings },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ settings: {} });
  }
}
