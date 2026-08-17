/**
 * Telegram Bot Integration
 * Send notifications and reports to Telegram
 */

const TELEGRAM_API_URL = "https://api.telegram.org/bot";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

export interface TelegramMessage {
  text: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  replyMarkup?: unknown;
}

export async function sendTelegramMessage(message: TelegramMessage): Promise<{
  success: boolean;
  messageId?: number;
  error?: string;
}> {
  if (!TOKEN || !CHAT_ID) {
    return {
      success: false,
      error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables",
    };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message.text,
        parse_mode: message.parseMode || "HTML",
        disable_web_page_preview: true,
        reply_markup: message.replyMarkup,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: data.description || "Failed to send message to Telegram",
      };
    }

    return {
      success: true,
      messageId: data.result?.message_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function formatReportForTelegram(reportText: string): TelegramMessage {
  const escaped = reportText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const formatted = escaped
    .replace(/^📊\s*\*\*(.*?)\*\*$/gm, "<b>📊 $1</b>")
    .replace(/^📅\s*(.*?)$/gm, "<i>📅 $1</i>")
    .replace(/^Status:\s*(.*)$/gm, "<b>Status: $1</b>")
    .replace(/^(├─|└─)\s*(.*?):/gm, "  <b>$2</b>:")
    .replace(/^---$/gm, "");

  return { text: formatted, parseMode: "HTML" };
}

export async function sendDailyReportToTelegram(
  businessName: string,
  reportContent: string,
  status: "healthy" | "warning" | "critical"
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const statusEmoji = {
    healthy: "✅",
    warning: "⚠️",
    critical: "🚨",
  };

  const header = `${statusEmoji[status]} <b>${businessName} - Daily Report</b>\n<i>${new Date().toLocaleDateString()}</i>\n\n`;
  const message = formatReportForTelegram(header + reportContent);

  return sendTelegramMessage(message);
}

export async function sendTelegramAlert(
  title: string,
  message: string,
  severity: "info" | "warning" | "critical" = "warning"
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const severityEmoji = {
    info: "ℹ️",
    warning: "⚠️",
    critical: "🚨",
  };

  const text = `${severityEmoji[severity]} <b>${title}</b>\n\n${message}\n\n<i>Time: ${new Date().toLocaleString()}</i>`;

  return sendTelegramMessage({ text, parseMode: "HTML" });
}

export async function sendTelegramWithButtons(
  title: string,
  message: string,
  buttons: Array<{ text: string; url: string }>
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const text = `<b>${title}</b>\n\n${message}`;
  const inlineKeyboard = buttons.map((btn) => [{ text: btn.text, url: btn.url }]);

  return sendTelegramMessage({
    text,
    parseMode: "HTML",
    replyMarkup: { inline_keyboard: inlineKeyboard },
  });
}

export async function testTelegramConnection(): Promise<{
  success: boolean;
  botInfo?: { username: string; firstName: string };
  chatInfo?: { chatId: string; type: string };
  error?: string;
}> {
  if (!TOKEN) {
    return { success: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  try {
    const botRes = await fetch(`${TELEGRAM_API_URL}${TOKEN}/getMe`);
    const botData = await botRes.json();

    if (!botRes.ok || !botData.ok) {
      return { success: false, error: botData.description || "Invalid token" };
    }

    if (CHAT_ID) {
      const testRes = await fetch(`${TELEGRAM_API_URL}${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: "✅ Telegram connection test successful!",
          parse_mode: "HTML",
        }),
      });

      const testData = await testRes.json();
      if (!testRes.ok || !testData.ok) {
        return { success: false, error: testData.description || "Send failed" };
      }
    }

    return {
      success: true,
      botInfo: {
        username: botData.result.username,
        firstName: botData.result.first_name,
      },
      chatInfo: CHAT_ID ? { chatId: CHAT_ID, type: "private" } : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    };
  }
}
