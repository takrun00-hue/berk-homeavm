import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const visitChatId = process.env.TELEGRAM_VISIT_CHAT_ID;

  return NextResponse.json({
    hasToken: !!token,
    hasVisitChatId: !!visitChatId,
    visitChatIdValue: visitChatId || "NOT SET",
  });
}
