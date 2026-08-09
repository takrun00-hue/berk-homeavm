import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = { ok: false, time: new Date().toISOString() };

  try {
    const r1 = await pool.sql`SELECT NOW() as now`;
    result.db_connected = true;
    result.db_time = r1.rows[0].now;
  } catch (e) {
    result.db_connected = false;
    result.db_error = String(e);
    return NextResponse.json(result);
  }

  try {
    const r2 = await pool.sql`SELECT COUNT(*) as cnt FROM products`;
    result.product_count = Number(r2.rows[0].cnt);
  } catch (e) {
    result.products_error = String(e);
    return NextResponse.json(result);
  }

  try {
    const r3 = await pool.sql`
      SELECT p.*, c.name_tr as cat_tr, c.name_en as cat_en
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY COALESCE(p.sort_order, 0) ASC, p.id ASC
      LIMIT 3
    `;
    result.sample_products = r3.rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name_tr: r.name_tr,
      cat_tr: r.cat_tr,
      cat_en: r.cat_en,
    }));
    result.ok = true;
  } catch (e) {
    result.query_error = String(e);
  }

  return NextResponse.json(result);
}
