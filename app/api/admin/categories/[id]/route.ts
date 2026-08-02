import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inUse = await pool.sql`SELECT id FROM products WHERE category_id = ${params.id}`;
  if (inUse.rows.length > 0) {
    return NextResponse.json(
      { success: false, message: "Bu kategoride ürünler var, önce onları taşıyın veya silin." },
      { status: 400 }
    );
  }

  await pool.sql`DELETE FROM categories WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
}
