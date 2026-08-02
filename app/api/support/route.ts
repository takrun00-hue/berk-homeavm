import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const { name, phone, email, message } = await req.json();

  if (!name || !message) {
    return NextResponse.json(
      { success: false, message: "Eksik bilgi." },
      { status: 400 }
    );
  }

  const text = `
🆘 <b>Yeni Destek Talebi</b>

👤 Ad: ${name}
📞 Telefon: ${phone || "-"}
📧 Email: ${email || "-"}

💬 Mesaj:
${message}
`.trim();

  await sendTelegramMessage(text);

  return NextResponse.json({ success: true });
}
