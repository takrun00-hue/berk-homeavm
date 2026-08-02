import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const expected = (process.env.ADMIN_PASSWORD || "").trim();
  if (key !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = `https://berk-homeavm.com/api/telegram-webhook`;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`
  );
  const data = await res.json();

  return NextResponse.json(data);
}
