import { createPool } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

const pool = createPool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { success: false, message: "Eksik bilgi." },
      { status: 400 }
    );
  }

  const existing = await pool.sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.rows.length > 0) {
    return NextResponse.json(
      { success: false, message: "Bu email zaten kayıtlı." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await pool.sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name}, ${email}, ${hash})
    RETURNING id, name, email
  `;
  const user = result.rows[0];

  const token = await createSession(user.id);
  const res = NextResponse.json({
    success: true,
    user: { name: user.name, email: user.email },
  });
  res.cookies.set("session_token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
