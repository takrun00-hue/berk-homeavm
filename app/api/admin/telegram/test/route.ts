import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";
import { testTelegramConnection, sendTelegramAlert } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await testTelegramConnection();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: "Telegram connection test failed",
          setup: {
            required_env: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"],
            docs: "https://core.telegram.org/bots",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Telegram connection test passed",
      bot: result.botInfo,
      chat: result.chatInfo,
    });
  } catch (e) {
    console.error("[/api/admin/telegram/test] error:", e);
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, message, severity } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Missing title or message" }, { status: 400 });
    }

    const result = await sendTelegramAlert(title, message, severity || "info");

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: "Alert sent to Telegram",
    });
  } catch (e) {
    console.error("[/api/admin/telegram/test POST] error:", e);
    return NextResponse.json({ error: "Failed to send alert" }, { status: 500 });
  }
}
