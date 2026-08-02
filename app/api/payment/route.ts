import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";

async function getSettings() {
  const { rows } = await pool.sql`SELECT key, value FROM site_settings`;
  const s: Record<string, string> = {};
  rows.forEach((r) => (s[r.key] = r.value));
  return s;
}

async function payWithIyzico(settings: any, form: any, items: any, total: number) {
  const apiKey = settings.iyzico_api_key;
  const secretKey = settings.iyzico_secret_key;
  const baseUrl = settings.iyzico_base_url || "https://sandbox-api.iyzipay.com";

  if (!apiKey || !secretKey) {
    return { success: true, demo: true, message: "Demo mode (iyzico key eksik)." };
  }

  const res = await fetch(`${baseUrl}/payment/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `IYZWS ${apiKey}:${secretKey}`,
    },
    body: JSON.stringify({
      locale: "tr",
      price: total,
      paidPrice: total,
      currency: "TRY",
      buyer: {
        name: form.name,
        email: form.email,
        gsmNumber: form.phone,
        registrationAddress: `${form.street || ""} ${form.neighborhood || ""} ${form.district || ""} ${form.province || ""}`,
      },
      paymentCard: {
        cardHolderName: form.cardName,
        cardNumber: form.cardNumber,
        expireMonth: form.expireMonth,
        expireYear: form.expireYear,
        cvc: form.cvc,
      },
      basketItems: items.map((i: any) => ({
        id: i.product.id,
        name: i.product.name.tr,
        category1: i.product.category.tr,
        itemType: "PHYSICAL",
        price: i.product.priceMin * i.quantity,
      })),
    }),
  });

  const result = await res.json();
  if (result.status === "success") {
    return { success: true };
  }
  return { success: false, message: result.errorMessage || "Ödeme başarısız." };
}

async function payWithPaytr(settings: any, form: any, items: any, total: number) {
  const merchantId = settings.paytr_merchant_id;
  const merchantKey = settings.paytr_merchant_key;
  const merchantSalt = settings.paytr_merchant_salt;

  if (!merchantId || !merchantKey || !merchantSalt) {
    return { success: true, demo: true, message: "Demo mode (PayTR key eksik)." };
  }

  // PayTR normalde bir "get-token" iframe akışı kullanır.
  // Burada temel doğrulama ve token isteği yapılır; gerçek ödeme
  // PayTR'nin iframe sayfasında tamamlanır.
  const merchantOid = `ORDER${Date.now()}`;
  const userIp = "0.0.0.0";
  const emailAddress = form.email;
  const paymentAmount = Math.round(total * 100); // kuruş cinsinden

  const basketArr = items.map((i: any) => [
    i.product.name.tr,
    (i.product.priceMin).toString(),
    i.quantity,
  ]);
  const userBasket = Buffer.from(JSON.stringify(basketArr)).toString("base64");

  const hashSTR = `${merchantId}${userIp}${merchantOid}${emailAddress}${paymentAmount}${userBasket}00${merchantSalt}`;
  const paytrToken = crypto
    .createHmac("sha256", merchantKey)
    .update(hashSTR)
    .digest("base64");

  try {
    const res = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        merchant_id: merchantId,
        user_ip: userIp,
        merchant_oid: merchantOid,
        email: emailAddress,
        payment_amount: String(paymentAmount),
        paytr_token: paytrToken,
        user_basket: userBasket,
        debug_on: "1",
        no_installment: "0",
        max_installment: "0",
        user_name: form.name,
        user_address: `${form.street || ""} ${form.neighborhood || ""} ${form.district || ""} ${form.province || ""}`,
        user_phone: form.phone,
        merchant_ok_url: "https://berk-homeavm.com/checkout/success",
        merchant_fail_url: "https://berk-homeavm.com/checkout",
        currency: "TL",
        test_mode: "1",
      }),
    });

    const result = await res.json();
    if (result.status === "success") {
      return { success: true, iframeToken: result.token };
    }
    return { success: false, message: result.reason || "PayTR hatası." };
  } catch (err) {
    return { success: false, message: "PayTR bağlantı hatası." };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { form, items, total } = await req.json();
    const settings = await getSettings();
    const gateway = settings.active_gateway || "none";

    if (gateway === "iyzico") {
      const result = await payWithIyzico(settings, form, items, total);
      return NextResponse.json(result);
    }

    if (gateway === "paytr") {
      const result = await payWithPaytr(settings, form, items, total);
      return NextResponse.json(result);
    }

    // gateway === "none"
    console.log("No payment gateway active. Demo mode.", { form, items, total });
    return NextResponse.json({
      success: true,
      demo: true,
      message: "Demo mode: ödeme simüle edildi (gerçek değil).",
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { success: false, message: "Sunucu hatası." },
      { status: 500 }
    );
  }
}
