import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { page } = await req.json();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "bilinmiyor";
  const userAgent = req.headers.get("user-agent") || "bilinmiyor";

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const visitChatId = process.env.TELEGRAM_VISIT_CHAT_ID;

  const text = `
👀 Yeni Ziyaret

📄 Sayfa: ${page}
🌍 IP: ${ip}
📱 Cihaz: ${userAgent.substring(0, 100)}
`.trim();

  if (token && visitChatId) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: visitChatId, text }),
      });
    } catch (err) {
      console.error("Telegram visit send error:", err);
    }
  }

  return NextResponse.json({ success: true });
}
