import { createPool } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

const pool = createPool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const result = await pool.sql`SELECT * FROM users WHERE email = ${email}`;
  const user = result.rows[0];

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Email veya şifre hatalı." },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { success: false, message: "Email veya şifre hatalı." },
      { status: 401 }
    );
  }

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
