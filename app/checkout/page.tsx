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
        setError(
          data.message ||
            (locale === "tr" ? "Sipariş başarısız oldu." : "Order failed.")
        );
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
        <p className="text-gray-500">
          {locale === "tr" ? "Sepetiniz boş." : "Your cart is empty."}
        </p>
      </section>
    );
  }

  return (
    <section className="py-10 px-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-center">
        {locale === "tr" ? "Sipariş Tamamla" : "Checkout"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* اطلاعات تماس */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm">
            {locale === "tr" ? "İletişim Bilgileri" : "Contact Information"}
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
        </div>

        {/* آدرس */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm">
            {locale === "tr" ? "Teslimat Adresi" : "Delivery Address"}
          </h2>

          <div className="flex gap-3">
            <input
              name="houseNo"
              required
              placeholder={locale === "tr" ? "Bina No" : "House No"}
              onChange={handleChange}
              className="w-1/2 border rounded-md px-4 py-3 text-sm"
            />
            <input
              name="apartmentNo"
              placeholder={locale === "tr" ? "Daire No" : "Apartment No"}
              onChange={handleChange}
              className="w-1/2 border rounded-md px-4 py-3 text-sm"
            />
          </div>

          <input
            name="street"
            required
            placeholder={locale === "tr" ? "Sokak" : "Street"}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />

          <input
            name="neighborhood"
            required
            placeholder={locale === "tr" ? "Mahalle" : "Neighborhood"}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />

          <input
            name="district"
            required
            placeholder={locale === "tr" ? "İlçe" : "District"}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />

          <input
            name="province"
            required
            placeholder={locale === "tr" ? "İl" : "Province"}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />
        </div>

        {/* توضیحات اضافی */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm">
            {locale === "tr" ? "Ek Bilgi" : "Additional Information"}
          </h2>
          <textarea
            name="notes"
            rows={3}
            placeholder={
              locale === "tr"
                ? "Siparişinizle ilgili notlar (opsiyonel)"
                : "Notes on your order (optional)"
            }
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />
        </div>

        {/* خلاصه سفارش */}
        <div className="space-y-2">
          <h2 className="font-bold text-sm">
            {locale === "tr" ? "SİPARİŞİNİZ" : "YOUR ORDER"}
          </h2>
          <div className="border rounded-md overflow-hidden text-sm">
            <div className="flex justify-between px-4 py-2 bg-gray-50 font-bold text-xs">
              <span>{locale === "tr" ? "ÜRÜN" : "PRODUCT"}</span>
              <span>{locale === "tr" ? "ARA TOPLAM" : "SUBTOTAL"}</span>
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
              <span>{locale === "tr" ? "Ara Toplam" : "Subtotal"}</span>
              <span>
                {formatPrice(total, locale)} {locale === "tr" ? "₺" : "TRY"}
              </span>
            </div>
            <div className="flex justify-between px-4 py-3 border-t font-extrabold">
              <span>{locale === "tr" ? "Toplam" : "Total"}</span>
              <span className="text-gold">
                {formatPrice(total, locale)} {locale === "tr" ? "₺" : "TRY"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          {locale === "tr"
            ? "Üzgünüz, şu anda kullanılabilir bir ödeme yöntemi bulunmuyor. Yardıma ihtiyacınız varsa veya alternatif düzenlemeler yapmak isterseniz lütfen bizimle iletişime geçin."
            : "Sorry, apparently there is no payment method available. Please contact us if you need help or want to make alternative arrangements."}
        </p>

        <p className="text-xs text-gray-500">
          {locale === "tr"
            ? "Kişisel verileriniz, siparişinizi işleme almak, bu web sitesindeki deneyiminizi desteklemek ve gizlilik politikamızda açıklanan diğer amaçlar için kullanılacaktır."
            : "Your personal data will be used to process your order, support your experience on this website and for other purposes described on our privacy policy page."}
        </p>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-gold py-3 rounded-md font-bold disabled:opacity-50"
        >
          {loading
            ? locale === "tr"
              ? "İşleniyor..."
              : "Processing..."
            : locale === "tr"
            ? "SİPARİŞİ ONAYLA"
            : "CONFIRM ORDER"}
        </button>
      </form>
    </section>
  );
}
