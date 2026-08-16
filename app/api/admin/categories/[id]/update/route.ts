import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, name_tr, name_en, image } = await req.json();

  // Same normalisation as the create route: a slug with a space or a Turkish
  // letter does not survive the ?category= round-trip, so the category filter
  // silently matches nothing.
  const cleanSlug = slugify(slug || "") || slugify(name_tr || "");
  if (!cleanSlug) {
    return NextResponse.json(
      { success: false, message: "Geçerli bir slug üretilemedi." },
      { status: 400 }
    );
  }

  await pool.sql`
    UPDATE categories SET
      slug = ${cleanSlug},
      name_tr = ${name_tr},
      name_en = ${name_en},
      image = ${image || ""}
    WHERE id = ${params.id}
  `;

  return NextResponse.json({ success: true });
}
