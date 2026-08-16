import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { rows } = await pool.sql`
      SELECT id, name, tracking_url, phone, is_active
      FROM cargo_companies
      ORDER BY name ASC
    `;
    return NextResponse.json({ companies: rows });
  } catch (e) {
    console.error("Cargo companies GET error:", e);
    return NextResponse.json({ error: "Veritabanı hatası." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, tracking_url, phone } = await req.json();
  if (!name) return NextResponse.json({ error: "Firma adı gerekli." }, { status: 400 });

  try {
    await pool.sql`
      INSERT INTO cargo_companies (name, tracking_url, phone, is_active)
      VALUES (${name}, ${tracking_url || ""}, ${phone || ""}, true)
    `;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Cargo company POST error:", e);
    const dup = e instanceof Error && e.message.includes("cargo_companies_name_key");
    return NextResponse.json(
      { error: dup ? "Bu isimde bir firma zaten var." : "Veritabanı hatası." },
      { status: dup ? 409 : 500 }
    );
  }
}
