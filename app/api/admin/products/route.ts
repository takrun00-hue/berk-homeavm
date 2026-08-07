import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.sql`
    SELECT p.*, c.name_tr as cat_tr FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.sort_order ASC
  `;
  return NextResponse.json({ products: rows });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    slug,
    name_tr,
    name_en,
    category_id,
    price_min,
    price_max,
    image,
    description_tr,
    description_en,
    discount_percent,
    variants,
  } = await req.json();

  if (!slug || !name_tr || !name_en || !image) {
    return NextResponse.json(
      { success: false, message: "Eksik bilgi." },
      { status: 400 }
    );
  }

  const maxOrder = await pool.sql`SELECT COALESCE(MAX(sort_order),0) as m FROM products`;
  const nextOrder = Number(maxOrder.rows[0].m) + 1;
  const discountPct = Math.max(0, Math.min(100, Number(discount_percent) || 0));
  const variantsJson = JSON.stringify(Array.isArray(variants) ? variants : []);

  try {
    await pool.sql`
      INSERT INTO products (slug, name_tr, name_en, category_id, price_min, price_max, image, description_tr, description_en, sort_order, discount_percent, variants)
      VALUES (${slug}, ${name_tr}, ${name_en}, ${category_id || null}, ${price_min}, ${price_max}, ${image}, ${description_tr || ""}, ${description_en || ""}, ${nextOrder}, ${discountPct}, ${variantsJson})
    `;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: "Bu slug zaten kullanılıyor." },
      { status: 400 }
    );
  }
}
