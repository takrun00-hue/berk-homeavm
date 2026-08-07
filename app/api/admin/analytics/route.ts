import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [catRows, priceRows, discountRows, topRows, allPriceRows] = await Promise.all([
      pool.sql`
        SELECT c.name_tr as category, COUNT(p.id)::int as count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        GROUP BY c.id, c.name_tr
        ORDER BY count DESC
      `,
      pool.sql`
        SELECT
          MIN(min_price)::float as min_price,
          MAX(max_price)::float as max_price,
          AVG((min_price + max_price) / 2.0)::float as avg_price,
          COUNT(*)::int as total
        FROM products
      `,
      pool.sql`
        SELECT
          COUNT(*) FILTER (WHERE discount_percent > 0)::int as discounted,
          COUNT(*) FILTER (WHERE discount_percent = 0 OR discount_percent IS NULL)::int as regular
        FROM products
      `,
      pool.sql`
        SELECT name_tr, min_price::float, max_price::float, COALESCE(discount_percent,0) as discount_percent
        FROM products
        ORDER BY max_price DESC
        LIMIT 5
      `,
      pool.sql`
        SELECT min_price::float, max_price::float FROM products
      `,
    ]);

    return NextResponse.json({
      byCategory: catRows.rows,
      priceStats: priceRows.rows[0] || {},
      discountStats: discountRows.rows[0] || {},
      topProducts: topRows.rows,
      allPrices: allPriceRows.rows,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, byCategory: [], priceStats: {}, discountStats: {}, topProducts: [], allPrices: [] }, { status: 500 });
  }
}
