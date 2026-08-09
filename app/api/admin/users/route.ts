import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.sql`
    SELECT id, name, email, COALESCE(discount_percent, 0) as discount_percent, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ users: rows });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, password } = await req.json();
  if (!name || !email || !password)
    return NextResponse.json({ error: "Eksik bilgi." }, { status: 400 });

  const existing = await pool.sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.rows.length > 0)
    return NextResponse.json({ error: "Bu email zaten kayıtlı." }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  await pool.sql`
    INSERT INTO users (name, email, password_hash) VALUES (${name}, ${email}, ${hash})
  `;
  return NextResponse.json({ success: true });
}
