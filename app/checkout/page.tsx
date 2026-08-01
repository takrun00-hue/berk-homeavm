"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, totalCount } = useCart();
  const { locale } = useLanguage();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    cardNumber: "",
    cardName: "",
    expireMonth: "",
    expireYear: "",
    cvc: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce(
    (sum, i) => sum + i.product.priceMin * i.quantity,
    0
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, items, total }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/checkout/success");
      } else {
        setError(data.message || "Ödeme başarısız oldu.");
      }
    } catch (err) {
      setError("Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (totalCount === 0) {
    return (
      <section className="py-16 px-4 max-w-md mx-auto text-center">
        <p className="text-gray-500">
          {locale === "tr" ? "Sepetiniz boş." : "Your cart is empty."}
        </p>
      </section>
    );
  }

  return (
    <section className="py-10 px-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-center">
        {locale === "tr" ? "Ödeme" : "Checkout"}
      </h1>

      <div className="border rounded-md p-4 space-y-1 text-sm">
        {items.map((i) => (
          <div key={i.product.id} className="flex justify-between">
            <span>
              {i.product.name[locale]} x{i.quantity}
            </span>
            <span>
              {formatPrice(i.product.priceMin * i.quantity, locale)}{" "}
              {locale === "tr" ? "₺" : "TRY"}
            </span>
          </div>
        ))}
        <div className="flex justify-between font-extrabold pt-2 border-t mt-2">
          <span>{locale === "tr" ? "Toplam" : "Total"}</span>
          <span className="text-gold">
            {formatPrice(total, locale)} {locale === "tr" ? "₺" : "TRY"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="font-bold text-sm">
          {locale === "tr" ? "Teslimat Bilgileri" : "Delivery Info"}
        </h2>
        <input
          name="name"
          required
          placeholder={locale === "tr" ? "Ad Soyad" : "Full Name"}
          onChange={handleChange}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          onChange={handleChange}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />
        <input
          name="phone"
          required
          placeholder={locale === "tr" ? "Telefon" : "Phone"}
          onChange={handleChange}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />
        <input
          name="address"
          required
          placeholder={locale === "tr" ? "Adres" : "Address"}
          onChange={handleChange}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />

        <h2 className="font-bold text-sm pt-2">
          {locale === "tr" ? "Kart Bilgileri" : "Card Info"}
        </h2>
        <input
          name="cardName"
          required
          placeholder={locale === "tr" ? "Kart Üzerindeki İsim" : "Name on Card"}
          onChange={handleChange}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />
        <input
          name="cardNumber"
          required
          maxLength={16}
          placeholder={locale === "tr" ? "Kart Numarası" : "Card Number"}
          onChange={handleChange}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />
        <div className="flex gap-2">
          <input
            name="expireMonth"
            required
            maxLength={2}
            placeholder="AA"
            onChange={handleChange}
            className="w-1/3 border rounded-md px-4 py-3 text-sm"
          />
          <input
            name="expireYear"
            required
            maxLength={4}
            placeholder="YYYY"
            onChange={handleChange}
            className="w-1/3 border rounded-md px-4 py-3 text-sm"
          />
          <input
            name="cvc"
            required
            maxLength={4}
            placeholder="CVC"
            onChange={handleChange}
            className="w-1/3 border rounded-md px-4 py-3 text-sm"
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-gold py-3 rounded-md font-bold mt-4 disabled:opacity-50"
        >
          {loading
            ? locale === "tr"
              ? "İşleniyor..."
              : "Processing..."
            : locale === "tr"
            ? "Ödemeyi Tamamla"
            : "Complete Payment"}
        </button>
      </form>
    </section>
  );
}
