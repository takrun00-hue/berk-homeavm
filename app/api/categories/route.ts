import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.sql`
    SELECT id, slug, name_tr, name_en, image, sort_order FROM categories ORDER BY sort_order ASC
  `;
  return NextResponse.json({ categories: rows });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, name_tr, name_en, image } = await req.json();
  if (!slug || !name_tr || !name_en) {
    return NextResponse.json(
      { success: false, message: "Eksik bilgi." },
      { status: 400 }
    );
  }

  const maxOrder = await pool.sql`SELECT COALESCE(MAX(sort_order),0) as m FROM categories`;
  const nextOrder = Number(maxOrder.rows[0].m) + 1;

  try {
    await pool.sql`
      INSERT INTO categories (slug, name_tr, name_en, image, sort_order)
      VALUES (${slug}, ${name_tr}, ${name_en}, ${image || ""}, ${nextOrder})
    `;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: "Bu slug zaten kullanılıyor." },
      { status: 400 }
    );
  }
}
