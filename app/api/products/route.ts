import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  let rows: Record<string, unknown>[] = [];

  // Try full query with categories JOIN
  try {
    const result = await pool.sql`
      SELECT p.*, c.name_tr as cat_tr, c.name_en as cat_en
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY COALESCE(p.sort_order, 0) ASC, p.id ASC
    `;
    rows = result.rows;
  } catch (err1) {
    console.error("[/api/products] JOIN query failed:", err1);
    // Fallback: simple query without JOIN
    try {
      const result = await pool.sql`
        SELECT * FROM products ORDER BY COALESCE(sort_order, 0) ASC, id ASC
      `;
      rows = result.rows.map((r) => ({ ...r, cat_tr: null, cat_en: null }));
    } catch (err2) {
      console.error("[/api/products] Simple query also failed:", err2);
      return NextResponse.json(
        { products: [], error: String(err2) },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }
  }

  const products = rows.map((r) => ({
    id: String(r.id),
    slug: r.slug,
    name: { tr: (r.name_tr as string) || "", en: (r.name_en as string) || "" },
    category: {
      tr: (r.cat_tr as string) || "",
      en: (r.cat_en as string) || (r.cat_tr as string) || "",
    },
    priceMin: Number(r.price_min) || 0,
    priceMax: Number(r.price_max) || 0,
    image: (r.image as string) || "",
    description: {
      tr: (r.description_tr as string) || "",
      en: (r.description_en as string) || "",
    },
    discountPercent: Number(r.discount_percent) || 0,
    variants: (() => {
      try {
        return JSON.parse((r.variants as string) || "[]");
      } catch {
        return [];
      }
    })(),
  }));

  return NextResponse.json(
    { products },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
