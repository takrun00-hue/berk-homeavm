import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { rows } = await pool.sql`
      SELECT
        o.id, o.status, o.total_price, o.subtotal, o.tax_rate, o.tax_amount,
        o.shipping_cost, o.shipping_status, o.cargo_company, o.tracking_number,
        o.customer_name, o.customer_email, o.customer_phone, o.shipping_address,
        o.payment_method, o.notes, o.items_snapshot,
        o.created_at, o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'name', COALESCE(p.name_tr, 'Silinmiş Ürün')
            ) ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 500
    `;
    return NextResponse.json({ orders: rows });
  } catch (e) {
    console.error("Orders GET error:", e);
    return NextResponse.json({ error: "Veritabanı hatası." }, { status: 500 });
  }
}
