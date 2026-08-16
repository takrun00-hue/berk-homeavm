import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";
import Stripe from "stripe";

async function getSettings() {
  const { rows } = await pool.sql`SELECT key, value FROM site_settings`;
  const s: Record<string, string> = {};
  rows.forEach((r) => (s[r.key] = r.value));
  return s;
}

// ── iyzico ─────────────────────────────────────────────────────────────────
async function payWithIyzico(settings: Record<string, string>, form: Record<string, string>, items: CartItem[], total: number) {
  const apiKey = settings.iyzico_api_key;
  const secretKey = settings.iyzico_secret_key;
  const baseUrl = settings.iyzico_base_url || "https://sandbox-api.iyzipay.com";

  if (!apiKey || !secretKey)
    return { success: true, demo: true, message: "Demo mode (iyzico key eksik)." };

  const res = await fetch(`${baseUrl}/payment/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `IYZWS ${apiKey}:${secretKey}` },
    body: JSON.stringify({
      locale: "tr",
      price: total,
      paidPrice: total,
      currency: "TRY",
      buyer: {
        name: form.name,
        email: form.email,
        gsmNumber: form.phone,
        registrationAddress: [form.street, form.neighborhood, form.district, form.province].filter(Boolean).join(" "),
      },
      paymentCard: {
        cardHolderName: form.cardName,
        cardNumber: form.cardNumber?.replace(/\s/g, ""),
        expireMonth: form.expireMonth,
        expireYear: form.expireYear,
        cvc: form.cvc,
      },
      basketItems: items.map((i) => ({
        id: String(i.product.id),
        name: i.product.name.tr,
        category1: i.product.category?.tr ?? "Genel",
        itemType: "PHYSICAL",
        price: i.product.priceMin * i.quantity,
      })),
    }),
  });

  const result = await res.json();
  if (result.status === "success") return { success: true };
  return { success: false, message: result.errorMessage || "Ödeme başarısız." };
}

// ── PayTR ──────────────────────────────────────────────────────────────────
async function payWithPaytr(settings: Record<string, string>, form: Record<string, string>, items: CartItem[], total: number) {
  const merchantId = settings.paytr_merchant_id;
  const merchantKey = settings.paytr_merchant_key;
  const merchantSalt = settings.paytr_merchant_salt;

  if (!merchantId || !merchantKey || !merchantSalt)
    return { success: true, demo: true, message: "Demo mode (PayTR key eksik)." };

  const merchantOid = `ORDER${Date.now()}`;
  const paymentAmount = Math.round(total * 100);
  const userBasket = Buffer.from(JSON.stringify(
    items.map((i) => [i.product.name.tr, String(i.product.priceMin), i.quantity])
  )).toString("base64");

  const hashSTR = `${merchantId}0.0.0.0${merchantOid}${form.email}${paymentAmount}${userBasket}00${merchantSalt}`;
  const paytrToken = crypto.createHmac("sha256", merchantKey).update(hashSTR).digest("base64");

  try {
    const res = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        merchant_id: merchantId,
        user_ip: "0.0.0.0",
        merchant_oid: merchantOid,
        email: form.email,
        payment_amount: String(paymentAmount),
        paytr_token: paytrToken,
        user_basket: userBasket,
        debug_on: "1",
        no_installment: "0",
        max_installment: "0",
        user_name: form.name,
        user_address: [form.street, form.neighborhood, form.district, form.province].filter(Boolean).join(" "),
        user_phone: form.phone,
        merchant_ok_url: "https://berk-homeavm.com/checkout/success",
        merchant_fail_url: "https://berk-homeavm.com/checkout",
        currency: "TL",
        test_mode: "1",
      }),
    });
    const result = await res.json();
    if (result.status === "success") return { success: true, redirect: true, iframeToken: result.token };
    return { success: false, message: result.reason || "PayTR hatası." };
  } catch {
    return { success: false, message: "PayTR bağlantı hatası." };
  }
}

// ── Stripe ─────────────────────────────────────────────────────────────────
async function payWithStripe(settings: Record<string, string>, items: CartItem[], total: number) {
  const secretKey = settings.stripe_secret_key;
  if (!secretKey) return { success: true, demo: true, message: "Demo mode (Stripe key eksik)." };

  const stripe = new Stripe(secretKey);
  const origin = "https://berk-homeavm.com";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: items.map((i) => ({
      price_data: {
        currency: "try",
        product_data: { name: i.product.name.tr },
        unit_amount: i.product.priceMin * 100,
      },
      quantity: i.quantity,
    })),
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout`,
  });

  return { success: true, redirect: true, redirectUrl: session.url };
}

// ── PayPal ─────────────────────────────────────────────────────────────────
async function getPaypalToken(clientId: string, clientSecret: string, mode: string) {
  const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return { token: data.access_token as string, base };
}

async function payWithPaypal(settings: Record<string, string>, items: CartItem[], total: number) {
  const clientId = settings.paypal_client_id;
  const clientSecret = settings.paypal_client_secret;
  const mode = settings.paypal_mode || "sandbox";

  if (!clientId || !clientSecret)
    return { success: true, demo: true, message: "Demo mode (PayPal key eksik)." };

  try {
    const { token, base } = await getPaypalToken(clientId, clientSecret, mode);
    const origin = "https://berk-homeavm.com";

    const res = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: (total / 30).toFixed(2), // TRY → USD approximate
            breakdown: {
              item_total: { currency_code: "USD", value: (total / 30).toFixed(2) },
            },
          },
          items: items.map((i) => ({
            name: i.product.name.tr,
            quantity: String(i.quantity),
            unit_amount: { currency_code: "USD", value: (i.product.priceMin / 30).toFixed(2) },
            category: "PHYSICAL_GOODS",
          })),
        }],
        application_context: {
          return_url: `${origin}/checkout/success`,
          cancel_url: `${origin}/checkout`,
          brand_name: "Berk HomeAVM",
          user_action: "PAY_NOW",
        },
      }),
    });

    const order = await res.json();
    const approveLink = order.links?.find((l: { rel: string; href: string }) => l.rel === "approve")?.href;
    if (approveLink) return { success: true, redirect: true, redirectUrl: approveLink };
    return { success: false, message: order.message || "PayPal siparişi oluşturulamadı." };
  } catch {
    return { success: false, message: "PayPal bağlantı hatası." };
  }
}

// ── Types ──────────────────────────────────────────────────────────────────
interface CartItem {
  product: {
    id: string | number;
    name: { tr: string; en: string };
    category?: { tr: string; en: string };
    priceMin: number;
  };
  quantity: number;
}

// ── Cargo auto-notification ─────────────────────────────────────────────────
async function notifyCargo(orderId: number, form: Record<string, string>, items: CartItem[], total: number, settings: Record<string, string>) {
  const webhookUrl = settings.cargo_webhook_url;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "new_order",
        orderId,
        customer: { name: form.name, phone: form.phone, email: form.email },
        address: [form.street, form.houseNo, form.apartmentNo, form.neighborhood, form.district, form.province].filter(Boolean).join(", "),
        items: items.map((i) => ({ name: i.product.name.tr, qty: i.quantity, price: i.product.priceMin })),
        total,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {}
}

// ── Save order to DB ────────────────────────────────────────────────────────
async function getEffectiveTaxRate(productId: string | number, settings: Record<string, string>): Promise<number> {
  try {
    const { rows } = await pool.sql`
      SELECT COALESCE(p.tax_rate, c.tax_rate) as effective_rate
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${Number(productId)}
    `;
    if (rows[0]?.effective_rate !== null && rows[0]?.effective_rate !== undefined) return Number(rows[0].effective_rate);
  } catch {}
  return Number(settings.default_tax_rate) || 20;
}

async function saveOrder(
  form: Record<string, string>,
  items: CartItem[],
  total: number,
  paymentMethod: string,
  settings: Record<string, string>
): Promise<{ orderId: number; taxRate: number } | null> {
  try {
    // Use tax rate from first item's product (or default)
    const taxRate = items.length > 0 ? await getEffectiveTaxRate(items[0].product.id, settings) : (Number(settings.default_tax_rate) || 20);
    const taxMultiplier = 1 + taxRate / 100;
    const subtotal = Math.round(total / taxMultiplier);
    const taxAmount = total - subtotal;
    const address = [
      form.street, form.houseNo, form.apartmentNo,
      form.neighborhood, form.district, form.province,
    ].filter(Boolean).join(", ");

    const { rows } = await pool.sql`
      INSERT INTO orders (
        status, total_price, subtotal, tax_rate, tax_amount,
        customer_name, customer_email, customer_phone,
        shipping_address, shipping_status, payment_method,
        notes, items_snapshot
      ) VALUES (
        'pending', ${total}, ${subtotal}, ${taxRate}, ${taxAmount},
        ${form.name || ''}, ${form.email || ''}, ${form.phone || ''},
        ${address}, 'pending', ${paymentMethod},
        ${form.notes || ''}, ${JSON.stringify(items.map(i => ({
          product_id: i.product.id,
          name: i.product.name.tr,
          quantity: i.quantity,
          unit_price: i.product.priceMin,
        })))}
      ) RETURNING id
    `;

    const orderId = rows[0].id;
    for (const item of items) {
      await pool.sql`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (${orderId}, ${Number(item.product.id) || null}, ${item.quantity}, ${item.product.priceMin})
      `;
    }
    return { orderId, taxRate };
  } catch (e) {
    console.error("Order save error:", e);
    return null;
  }
}

// ── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { form, items, total } = await req.json();
    const settings = await getSettings();
    const gateway = settings.active_gateway || "none";

    let result;
    if (gateway === "iyzico") result = await payWithIyzico(settings, form, items, total);
    else if (gateway === "paytr")  result = await payWithPaytr(settings, form, items, total);
    else if (gateway === "stripe") result = await payWithStripe(settings, items, total);
    else if (gateway === "paypal") result = await payWithPaypal(settings, items, total);
    else result = { success: true, demo: true };

    // Save order and trigger cargo notification
    if (result.success) {
      const saved = await saveOrder(form, items, total, gateway, settings);
      if (saved) {
        notifyCargo(saved.orderId, form, items, total, settings).catch(() => {});
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ success: false, message: "Sunucu hatası." }, { status: 500 });
  }
}

// GET — returns active gateway + custom methods for checkout page
export async function GET() {
  try {
    const settings = await getSettings();
    const customs = (() => {
      try { return JSON.parse(settings.custom_payment_methods || "[]"); }
      catch { return []; }
    })();
    return NextResponse.json({
      gateway: settings.active_gateway || "none",
      customs,
    });
  } catch {
    return NextResponse.json({ gateway: "none", customs: [] });
  }
}
