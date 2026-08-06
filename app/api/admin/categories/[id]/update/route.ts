import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, name_tr, name_en, image } = await req.json();

  await pool.sql`
    UPDATE categories SET
      slug = ${slug},
      name_tr = ${name_tr},
      name_en = ${name_en},
      image = ${image || ""}
    WHERE id = ${params.id}
  `;

  return NextResponse.json({ success: true });
}
