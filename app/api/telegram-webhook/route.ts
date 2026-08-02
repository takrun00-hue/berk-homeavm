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
      SELECT p.name_tr, p.name_en, p.price_min, p.price_max,
             p.description_tr, p.description_en,
             c.name_tr as cat_tr, c.name_en as cat_en
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.sort_order ASC
    `;
    return rows
      .map(
        (p) =>
          `- [TR] ${p.name_tr} (${p.cat_tr || ""}): ${p.price_min}-${p.price_max} TL. ${p.description_tr}\n  [EN] ${p.name_en} (${p.cat_en || ""}): ${p.price_min}-${p.price_max} TRY. ${p.description_en}`
      )
      .join("\n");
  } catch {
    return "";
  }
}

async function getContactInfo() {
  try {
    const { rows } = await pool.sql`
      SELECT key, value FROM site_settings
      WHERE key IN ('contact_phone', 'contact_email', 'contact_address')
    `;
    const s: Record<string, string> = {};
    rows.forEach((r) => (s[r.key] = r.value));
    return `Telefon: ${s.contact_phone || "-"} / Phone: ${s.contact_phone || "-"}\nEmail: ${s.contact_email || "-"}\nAdres/Address: ${s.contact_address || "-"}`;
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
      max_tokens: 1500,
      temperature: 0.4,
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
  const contactInfo = await getContactInfo();

  const systemPrompt = `Sen Berk-HomeAVM mobilya mağazasının müşteri destek asistanısın. Mağazanın adı "Berk-HomeAVM"dir, kendini tanıtırken veya mağazadan bahsederken her zaman bu ismi kullan.

KURALLAR:
1. Müşterinin mesajının dilini tespit et (Türkçe veya İngilizce) ve MUTLAKA aynı dilde cevap ver.
2. Ürünler, fiyatlar, kategoriler hakkında sorulan her soruyu aşağıdaki listeden yararlanarak kapsamlı ve net cevapla.
3. Kibar, sıcak ve profesyonel bir dil kullan.
4. Ürün önerirken fiyat aralığını ve kısa açıklamasını da belirt.
5. Eğer soru ürün kataloğunda olmayan bir konuda ise, müşteriye bir yetkilinin en kısa sürede kendisiyle iletişime geçeceğini söyle.
6. Cevapların detaylı ve kapsamlı olsun, gerektiğinde birden fazla paragraf kullan.

MEVCUT ÜRÜNLER:
${productContext}

İLETİŞİM BİLGİLERİ:
${contactInfo}`;

  try {
    const replyText =
      (await askGroq(systemPrompt, userText)) ||
      "Üzgünüz, şu anda cevap veremiyoruz. En kısa sürede size dönüş yapacağız. / Sorry, we cannot respond right now. We will get back to you shortly.";

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
      "Üzgünüz, şu anda cevap veremiyoruz. / Sorry, we cannot respond right now."
    );
  }

  return NextResponse.json({ ok: true });
}
