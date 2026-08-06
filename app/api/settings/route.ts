import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { rows } = await pool.sql`
    SELECT key, value FROM site_settings
    WHERE key IN ('contact_phone', 'contact_email', 'contact_address', 'social_instagram', 'social_facebook', 'social_whatsapp')
  `;

  const settings: Record<string, string> = {};
  rows.forEach((r) => (settings[r.key] = r.value));

  return NextResponse.json(
    { settings },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
