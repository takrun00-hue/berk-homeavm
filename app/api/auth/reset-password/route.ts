import { createPool } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const pool = createPool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json(
      { success: false, message: "Eksik bilgi." },
      { status: 400 }
    );
  }

  const result = await pool.sql`
    SELECT * FROM password_resets
    WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
  `;
  const reset = result.rows[0];

  if (!reset) {
    return NextResponse.json(
      { success: false, message: "Link geçersiz veya süresi dolmuş." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 10);
  await pool.sql`UPDATE users SET password_hash = ${hash} WHERE email = ${reset.email}`;
  await pool.sql`UPDATE password_resets SET used = TRUE WHERE token = ${token}`;

  return NextResponse.json({ success: true });
}
