"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, totalCount } = useCart();
  const { locale, t } = useLanguage();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    houseNo: "",
    apartmentNo: "",
    street: "",
    neighborhood: "",
    district: "",
    province: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce(
    (sum, i) => sum + i.product.priceMin * i.quantity,
    0
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
        setError(data.message || "Order failed.");
      }
    } catch (err) {
      setError(
        locale === "tr"
          ? "Bir hata oluştu, lütfen tekrar deneyin."
          : "An error occurred, please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (totalCount === 0) {
    return (
      <section className="py-16 px-4 max-w-md mx-auto text-center">
        <p className="text-gray-500">{t("cartEmptyCheckout")}</p>
      </section>
    );
  }

  return (
    <section className="py-10 px-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-center">
        {t("checkoutTitle")}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-bold text-sm">{t("contactInfo")}</h2>
          <input
            name="name"
            required
            placeholder={t("fullName")}
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
            placeholder={t("formPhone")}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-sm">{t("deliveryAddress")}</h2>

          <div className="flex gap-3">
            <input
              name="houseNo"
              required
              placeholder={t("houseNo")}
              onChange={handleChange}
              className="w-1/2 border rounded-md px-4 py-3 text-sm"
            />
            <input
              name="apartmentNo"
              placeholder={t("apartmentNo")}
              onChange={handleChange}
              className="w-1/2 border rounded-md px-4 py-3 text-sm"
            />
          </div>

          <input
            name="street"
            required
            placeholder={t("street")}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />

          <input
            name="neighborhood"
            required
            placeholder={t("neighborhood")}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />

          <input
            name="district"
            required
            placeholder={t("district")}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />

          <input
            name="province"
            required
            placeholder={t("province")}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-sm">{t("additionalInfo")}</h2>
          <textarea
            name="notes"
            rows={3}
            placeholder={t("orderNotes")}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <h2 className="font-bold text-sm">{t("yourOrder")}</h2>
          <div className="border rounded-md overflow-hidden text-sm">
            <div className="flex justify-between px-4 py-2 bg-gray-50 font-bold text-xs">
              <span>{t("product")}</span>
              <span>{t("subtotal")}</span>
            </div>
            {items.map((i) => (
              <div
                key={i.product.id}
                className="flex justify-between px-4 py-2 border-t"
              >
                <span>
                  {i.product.name[locale]} × {i.quantity}
                </span>
                <span>
                  {formatPrice(i.product.priceMin * i.quantity, locale)}{" "}
                  {locale === "tr" ? "₺" : "TRY"}
                </span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2 border-t">
              <span>{t("subtotalLabel")}</span>
              <span>
                {formatPrice(total, locale)} {locale === "tr" ? "₺" : "TRY"}
              </span>
            </div>
            <div className="flex justify-between px-4 py-3 border-t font-extrabold">
              <span>{t("total")}</span>
              <span className="text-gold">
                {formatPrice(total, locale)} {locale === "tr" ? "₺" : "TRY"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500">{t("noPaymentMethod")}</p>
        <p className="text-xs text-gray-500">{t("privacyNote")}</p>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-gold py-3 rounded-md font-bold disabled:opacity-50"
        >
          {loading ? t("processing") : t("confirmOrder")}
        </button>
      </form>
    </section>
  );
}
