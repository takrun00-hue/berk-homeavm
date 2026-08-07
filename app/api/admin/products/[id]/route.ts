import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const discountPct = Math.max(0, Math.min(100, Number(discount_percent) || 0));
  const variantsJson = JSON.stringify(Array.isArray(variants) ? variants : []);

  await pool.sql`
    UPDATE products SET
      slug = ${slug},
      name_tr = ${name_tr},
      name_en = ${name_en},
      category_id = ${category_id || null},
      price_min = ${price_min},
      price_max = ${price_max},
      image = ${image},
      description_tr = ${description_tr || ""},
      description_en = ${description_en || ""},
      discount_percent = ${discountPct},
      variants = ${variantsJson}
    WHERE id = ${params.id}
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await pool.sql`DELETE FROM products WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
}
