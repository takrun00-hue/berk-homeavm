import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.sql`
    SELECT id, slug, name_tr, name_en, image, sort_order FROM categories ORDER BY sort_order ASC
  `;
  return NextResponse.json(
    { categories: rows },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    }
  );
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

  // Normalise server-side: the slug is read back out of the ?category= query
  // string, so anything with a space or a Turkish letter fails to match once
  // the URL parser has been through it.
  const cleanSlug = slugify(slug) || slugify(name_tr);
  if (!cleanSlug) {
    return NextResponse.json(
      { success: false, message: "Geçerli bir slug üretilemedi." },
      { status: 400 }
    );
  }

  const maxOrder = await pool.sql`SELECT COALESCE(MAX(sort_order),0) as m FROM categories`;
  const nextOrder = Number(maxOrder.rows[0].m) + 1;

  try {
    const { rows } = await pool.sql`
      INSERT INTO categories (slug, name_tr, name_en, image, sort_order)
      VALUES (${cleanSlug}, ${name_tr}, ${name_en}, ${image || ""}, ${nextOrder})
      RETURNING id, slug, name_tr, name_en, image, sort_order
    `;
    return NextResponse.json({ success: true, category: rows[0] });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: "Bu slug zaten kullanılıyor." },
      { status: 400 }
    );
  }
}
