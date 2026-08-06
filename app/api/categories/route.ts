import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { rows } = await pool.sql`
    SELECT id, slug, name_tr, name_en FROM categories ORDER BY sort_order ASC
  `;

  const categories = rows.map((r) => ({
    id: String(r.id),
    slug: r.slug,
    name: { tr: r.name_tr, en: r.name_en },
  }));

  return NextResponse.json(
    { categories },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
