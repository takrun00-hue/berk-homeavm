import { NextRequest, NextResponse } from "next/server";

// این فایل هروقت API Key واقعی iyzico را در Vercel اضافه کردید،
// خودکار فعال می‌شود، نیازی به تغییر کد نیست.

export async function POST(req: NextRequest) {
  try {
    const { form, items, total } = await req.json();

    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;
    const baseUrl =
      process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

    // اگر هنوز کلید iyzico وارد نشده، حالت آزمایشی (Demo)
    if (!apiKey || !secretKey) {
      console.log("IYZICO keys not set yet. Demo mode active.", {
        form,
        items,
        total,
      });
      return NextResponse.json({
        success: true,
        demo: true,
        message: "Demo mode: ödeme simüle edildi (gerçek değil).",
      });
    }

    // --- گام بعدی: اتصال واقعی به iyzico ---
    // اینجا بعداً درخواست واقعی به iyzico ارسال می‌شود
    // با استفاده از apiKey و secretKey از Environment Variables

    const iyzicoResponse = await fetch(`${baseUrl}/payment/auth`, {
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
          registrationAddress: form.address,
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

    const result = await iyzicoResponse.json();

    if (result.status === "success") {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({
        success: false,
        message: result.errorMessage || "Ödeme başarısız.",
      });
    }
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { success: false, message: "Sunucu hatası." },
      { status: 500 }
    );
  }
}
