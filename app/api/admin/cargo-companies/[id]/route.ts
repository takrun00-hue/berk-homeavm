import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, tracking_url, phone, is_active } = await req.json();
  if (!name) return NextResponse.json({ error: "Firma adı gerekli." }, { status: 400 });

  try {
    await pool.sql`
      UPDATE cargo_companies SET
        name = ${name},
        tracking_url = ${tracking_url || ""},
        phone = ${phone || ""},
        is_active = ${is_active ?? true}
      WHERE id = ${params.id}
    `;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Cargo company PUT error:", e);
    const dup = e instanceof Error && e.message.includes("cargo_companies_name_key");
    return NextResponse.json(
      { error: dup ? "Bu isimde bir firma zaten var." : "Veritabanı hatası." },
      { status: dup ? 409 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Orders reference companies by id, so a company still in use cannot be
    // removed. Deactivating hides it from the dropdown without losing history.
    const { rows } = await pool.sql`
      SELECT count(*)::int AS n FROM orders WHERE cargo_company_id = ${params.id}
    `;
    if (rows[0]?.n > 0) {
      return NextResponse.json(
        {
          error: `Bu firma ${rows[0].n} siparişte kullanılıyor. Silmek yerine pasifleştirin.`,
        },
        { status: 409 }
      );
    }

    await pool.sql`DELETE FROM cargo_companies WHERE id = ${params.id}`;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Cargo company DELETE error:", e);
    return NextResponse.json({ error: "Veritabanı hatası." }, { status: 500 });
  }
}
