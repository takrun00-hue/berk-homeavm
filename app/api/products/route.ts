import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { rows } = await pool.sql`
      SELECT p.*, c.name_tr as cat_tr, c.name_en as cat_en
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY COALESCE(p.sort_order, 0) ASC, p.id ASC
    `;

    const products = rows.map((r) => ({
      id: String(r.id),
      slug: r.slug,
      name: { tr: r.name_tr || "", en: r.name_en || "" },
      category: { tr: r.cat_tr || "", en: r.cat_en || r.cat_tr || "" },
      priceMin: Number(r.price_min) || 0,
      priceMax: Number(r.price_max) || 0,
      image: r.image || "",
      description: { tr: r.description_tr || "", en: r.description_en || "" },
      discountPercent: Number(r.discount_percent) || 0,
      variants: (() => { try { return JSON.parse(r.variants || "[]"); } catch { return []; } })(),
    }));

    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("[/api/products] DB error:", err);
    return NextResponse.json({ products: [], error: String(err) });
  }
}
