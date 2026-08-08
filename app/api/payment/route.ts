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

// ── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { form, items, total } = await req.json();
    const settings = await getSettings();
    const gateway = settings.active_gateway || "none";

    if (gateway === "iyzico") return NextResponse.json(await payWithIyzico(settings, form, items, total));
    if (gateway === "paytr")  return NextResponse.json(await payWithPaytr(settings, form, items, total));
    if (gateway === "stripe") return NextResponse.json(await payWithStripe(settings, items, total));
    if (gateway === "paypal") return NextResponse.json(await payWithPaypal(settings, items, total));

    // gateway === "none" — demo / custom method
    return NextResponse.json({ success: true, demo: true });
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
