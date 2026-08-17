import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const BOT_LINK = "https://t.me/BerkHomeAVM_bot";

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

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "No message" }, { status: 400 });
  }

  const productContext = await getStoreContext();
  const contactInfo = await getContactInfo();

  const systemPrompt = `Sen Berk-HomeAVM mobilya mağazasının web sitesindeki müşteri destek asistanısın. Mağazanın adı "Berk-HomeAVM"dir.

KURALLAR:
1. Müşterinin mesajının dilini tespit et (Türkçe veya İngilizce) ve MUTLAKA aynı dilde cevap ver.
2. Ürünler, fiyatlar, kategoriler hakkında sorulan her soruyu aşağıdaki listeden yararlanarak kapsamlı ve net cevapla.
3. Kibar, sıcak ve profesyonel bir dil kullan.
4. Eğer soru ürün kataloğunda olmayan bir konuda ise, müşteriye bir yetkilinin en kısa sürede kendisiyle iletişime geçeceğini söyle.
5. Cevapların detaylı ve kapsamlı olsun.

MEVCUT ÜRÜNLER:
${productContext}

İLETİŞİM BİLGİLERİ:
${contactInfo}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []),
    { role: "user", content: message },
  ];

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 1500,
        temperature: 0.4,
      }),
    });

    const data = await res.json();
    let reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, we cannot respond right now.";

    reply += `\n\n🔗 Telegram: ${BOT_LINK}`;

    await sendTelegramMessage({
      text: `💻 <b>Site Chat</b>\n\n👤 Soru: ${message}\n\n🤖 Cevap: ${reply}`,
    });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Site chat error:", err);
    return NextResponse.json(
      { reply: `Sorry, we cannot respond right now.\n\n🔗 Telegram: ${BOT_LINK}` },
      { status: 500 }
    );
  }
}
