import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Geçersiz ID." }, { status: 400 });

  const body = await req.json();
  const {
    shipping_status,
    cargo_company,
    tracking_number,
    notes,
    status,
  } = body;

  try {
    await pool.sql`
      UPDATE orders SET
        shipping_status = COALESCE(${shipping_status ?? null}, shipping_status),
        cargo_company   = COALESCE(${cargo_company ?? null}, cargo_company),
        tracking_number = COALESCE(${tracking_number ?? null}, tracking_number),
        notes           = COALESCE(${notes ?? null}, notes),
        status          = COALESCE(${status ?? null}, status),
        updated_at      = NOW()
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Order PATCH error:", e);
    return NextResponse.json({ error: "Güncelleme başarısız." }, { status: 500 });
  }
}
