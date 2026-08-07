import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  const result = await pool.sql`SELECT id FROM users WHERE email = ${email}`;

  if (result.rows.length > 0) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await pool.sql`
      INSERT INTO password_resets (email, token, expires_at)
      VALUES (${email}, ${token}, ${expires.toISOString()})
    `;

    const resetUrl = `https://berk-homeavm.com/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: "MY BRAND <onboarding@resend.dev>",
        to: email,
        subject: "Şifre Sıfırlama",
        html: `
          <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın (15 dakika geçerlidir):</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Bu isteği siz yapmadıysanız bu emaili göz ardı edin.</p>
        `,
      });
    } catch (err) {
      console.error("Email send error:", err);
    }
  }

  return NextResponse.json({
    success: true,
    message: "Eğer bu email kayıtlıysa, sıfırlama linki gönderildi.",
  });
}
