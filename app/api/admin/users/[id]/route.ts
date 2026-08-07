import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { discount_percent } = await req.json();
  const pct = Math.max(0, Math.min(100, Number(discount_percent) || 0));

  await pool.sql`
    UPDATE users SET discount_percent = ${pct} WHERE id = ${params.id}
  `;
  return NextResponse.json({ success: true });
}
