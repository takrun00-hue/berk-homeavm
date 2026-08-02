import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const { page } = await req.json();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "bilinmiyor";
  const userAgent = req.headers.get("user-agent") || "bilinmiyor";

  const text = `
👀 <b>Yeni Ziyaret</b>

📄 Sayfa: ${page}
🌍 IP: ${ip}
📱 Cihaz: ${userAgent.substring(0, 100)}
`.trim();

  await sendTelegramMessage(text);

  return NextResponse.json({ success: true });
}
