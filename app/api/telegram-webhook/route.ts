import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function sendMessage(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function getStoreContext() {
  try {
    const { rows } = await pool.sql`
      SELECT name_tr, price_min, price_max FROM products ORDER BY sort_order ASC LIMIT 20
    `;
    return rows
      .map((p) => `- ${p.name_tr}: ${p.price_min}-${p.price_max} TL`)
      .join("\n");
  } catch {
    return "";
  }
}

async function askGroq(systemPrompt: string, userText: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      max_tokens: 500,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body.message;

  if (!message || !message.text) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const userText = message.text;
  const userName = message.from?.first_name || "Müşteri";

  if (String(chatId) === String(ADMIN_CHAT_ID)) {
    return NextResponse.json({ ok: true });
  }

  const productContext = await getStoreContext();
  const systemPrompt = `Sen MY BRAND mobilya mağazasının müşteri destek asistanısın. Türkçe ve kibar bir dille cevap ver. Kısa ve net ol. Aşağıda mevcut ürünler ve fiyat aralıkları var:\n\n${productContext}\n\nEğer soruyu cevaplayamıyorsan, müşteriye bir yetkilinin en kısa sürede döneceğini söyle.`;

  try {
    const replyText =
      (await askGroq(systemPrompt, userText)) ||
      "Üzgünüz, şu anda cevap veremiyoruz. En kısa sürede size dönüş yapacağız.";

    await sendMessage(chatId, replyText);

    if (ADMIN_CHAT_ID) {
      await sendMessage(
        ADMIN_CHAT_ID,
        `💬 ${userName} (Bot Chat)\n\n👤 Soru: ${userText}\n\n🤖 Cevap: ${replyText}`
      );
    }
  } catch (err) {
    console.error("AI reply error:", err);
    await sendMessage(
      chatId,
      "Üzgünüz, şu anda cevap veremiyoruz. En kısa sürede size dönüş yapacağız."
    );
  }

  return NextResponse.json({ ok: true });
}
