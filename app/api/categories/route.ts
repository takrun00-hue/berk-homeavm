import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  try {
    const { rows } = await pool.sql`
      SELECT id, slug, name_tr, name_en, COALESCE(image, '') as image
      FROM categories
      ORDER BY COALESCE(sort_order, 0) ASC, id ASC
    `;

    const categories = rows.map((r) => ({
      id: String(r.id),
      slug: r.slug,
      name: { tr: r.name_tr, en: r.name_en },
      image: r.image || "",
    }));

    return NextResponse.json(
      { categories },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/categories] DB error:", msg);
    return NextResponse.json(
      { categories: [], error: msg },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  }
}
