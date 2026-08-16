"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";
import { CreditCard, Wallet, Building2 } from "lucide-react";

interface CustomMethod { name: string; details: string; }

function CardFields({ form, onChange }: { form: Record<string, string>; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard size={16} className="text-gold" />
        <h2 className="font-bold text-sm">Kart Bilgileri</h2>
      </div>
      <input name="cardName" required placeholder="Kart üzerindeki ad" onChange={onChange} value={form.cardName || ""} className="w-full border rounded-md px-4 py-3 text-sm" />
      <input
        name="cardNumber"
        required
        placeholder="0000 0000 0000 0000"
        maxLength={19}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, "").slice(0, 16);
          const formatted = val.match(/.{1,4}/g)?.join(" ") ?? val;
          onChange({ ...e, target: { ...e.target, name: "cardNumber", value: formatted } } as React.ChangeEvent<HTMLInputElement>);
        }}
        value={form.cardNumber || ""}
        className="w-full border rounded-md px-4 py-3 text-sm font-mono tracking-wider"
      />
      <div className="flex gap-3">
        <input
          name="expireMonth"
          required
          placeholder="AA"
          maxLength={2}
          onChange={onChange}
          value={form.expireMonth || ""}
          className="w-1/3 border rounded-md px-4 py-3 text-sm text-center"
        />
        <input
          name="expireYear"
          required
          placeholder="YYYY"
          maxLength={4}
          onChange={onChange}
          value={form.expireYear || ""}
          className="w-1/3 border rounded-md px-4 py-3 text-sm text-center"
        />
        <input
          name="cvc"
          required
          placeholder="CVV"
          maxLength={4}
          onChange={onChange}
          value={form.cvc || ""}
          className="w-1/3 border rounded-md px-4 py-3 text-sm text-center"
          type="password"
        />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, totalCount, clearCart } = useCart();
  const { locale, t } = useLanguage();
  const router = useRouter();

  const [gateway, setGateway] = useState<string>("none");
  const [customs, setCustoms] = useState<CustomMethod[]>([]);
  const [selectedCustom, setSelectedCustom] = useState<number>(0);
  const [gwLoading, setGwLoading] = useState(true);

  const [form, setForm] = useState<Record<string, string>>({
    name: "", email: "", phone: "",
    houseNo: "", apartmentNo: "", street: "",
    neighborhood: "", district: "", province: "",
    notes: "",
    cardName: "", cardNumber: "", expireMonth: "", expireYear: "", cvc: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/payment")
      .then((r) => r.json())
      .then((d) => { setGateway(d.gateway || "none"); setCustoms(d.customs || []); })
      .catch(() => {})
      .finally(() => setGwLoading(false));
  }, []);

  const total = items.reduce((sum, i) => sum + i.product.priceMin * i.quantity, 0);
  const subtotalBeforeTax = Math.round(total / 1.2);
  const taxAmount = total - subtotalBeforeTax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload: Record<string, unknown> = { form, items, total };
    if (gateway === "custom" && customs.length > 0) {
      payload.customMethod = customs[selectedCustom];
    }

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.redirect && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.success) {
        clearCart();
        router.push("/checkout/success");
      } else {
        setError(data.message || "Ödeme başarısız.");
      }
    } catch {
      setError(locale === "tr" ? "Bir hata oluştu, lütfen tekrar deneyin." : "An error occurred, please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (totalCount === 0) {
    return (
      <section className="py-16 px-4 max-w-md mx-auto text-center">
        <p className="text-gray-500">{t("cartEmptyCheckout")}</p>
      </section>
    );
  }

  const gatewayLabel: Record<string, string> = {
    iyzico: "iyzico ile Öde",
    paytr: "PayTR ile Öde",
    stripe: "Stripe ile Öde (Kredi/Banka Kartı)",
    paypal: "PayPal ile Öde",
    none: "Siparişi Onayla",
  };

  return (
    <section className="py-10 px-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-center">{t("checkoutTitle")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm">{t("contactInfo")}</h2>
          <input name="name" required placeholder={t("fullName")} onChange={handleChange} value={form.name} className="w-full border rounded-md px-4 py-3 text-sm" />
          <input name="email" type="email" required placeholder="Email" onChange={handleChange} value={form.email} className="w-full border rounded-md px-4 py-3 text-sm" />
          <input name="phone" required placeholder={t("formPhone")} onChange={handleChange} value={form.phone} className="w-full border rounded-md px-4 py-3 text-sm" />
        </div>

        {/* Address */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm">{t("deliveryAddress")}</h2>
          <div className="flex gap-3">
            <input name="houseNo" required placeholder={t("houseNo")} onChange={handleChange} value={form.houseNo} className="w-1/2 border rounded-md px-4 py-3 text-sm" />
            <input name="apartmentNo" placeholder={t("apartmentNo")} onChange={handleChange} value={form.apartmentNo} className="w-1/2 border rounded-md px-4 py-3 text-sm" />
          </div>
          <input name="street" required placeholder={t("street")} onChange={handleChange} value={form.street} className="w-full border rounded-md px-4 py-3 text-sm" />
          <input name="neighborhood" required placeholder={t("neighborhood")} onChange={handleChange} value={form.neighborhood} className="w-full border rounded-md px-4 py-3 text-sm" />
          <input name="district" required placeholder={t("district")} onChange={handleChange} value={form.district} className="w-full border rounded-md px-4 py-3 text-sm" />
          <input name="province" required placeholder={t("province")} onChange={handleChange} value={form.province} className="w-full border rounded-md px-4 py-3 text-sm" />
          <textarea name="notes" rows={2} placeholder={t("orderNotes")} onChange={handleChange} value={form.notes} className="w-full border rounded-md px-4 py-3 text-sm" />
        </div>

        {/* Payment section */}
        {!gwLoading && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Wallet size={16} className="text-gold" />
              Ödeme Yöntemi
            </h2>

            {/* iyzico: card fields */}
            {gateway === "iyzico" && (
              <CardFields form={form} onChange={handleChange} />
            )}

            {/* Stripe: redirect info */}
            {gateway === "stripe" && (
              <div className="border rounded-md p-4 bg-blue-50 text-sm space-y-1">
                <p className="font-semibold text-blue-800">Stripe Güvenli Ödeme</p>
                <p className="text-blue-600 text-xs">Butona tıkladığınızda güvenli Stripe ödeme sayfasına yönlendirileceksiniz. Kredi kartı, Google Pay ve Apple Pay desteklenmektedir.</p>
              </div>
            )}

            {/* PayPal: redirect info */}
            {gateway === "paypal" && (
              <div className="border rounded-md p-4 bg-yellow-50 text-sm space-y-1">
                <p className="font-semibold text-yellow-800">PayPal ile Öde</p>
                <p className="text-yellow-700 text-xs">Butona tıkladığınızda PayPal ödeme sayfasına yönlendirileceksiniz. PayPal hesabı veya kredi/banka kartıyla ödeme yapabilirsiniz.</p>
              </div>
            )}

            {/* PayTR: redirect info */}
            {gateway === "paytr" && (
              <div className="border rounded-md p-4 bg-gray-50 text-sm space-y-1">
                <p className="font-semibold">PayTR Güvenli Ödeme</p>
                <p className="text-gray-600 text-xs">Siparişi onayladıktan sonra PayTR güvenli ödeme sayfasına yönlendirileceksiniz.</p>
              </div>
            )}

            {/* None: custom methods or cash */}
            {(gateway === "none" || gateway === "custom") && (
              customs.length > 0 ? (
                <div className="space-y-2">
                  {customs.map((m, i) => (
                    <label key={i} className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer ${selectedCustom === i ? "border-black" : "border-gray-200"}`}>
                      <input type="radio" name="customMethod" checked={selectedCustom === i} onChange={() => setSelectedCustom(i)} className="mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm flex items-center gap-1">
                          <Building2 size={14} />
                          {m.name}
                        </p>
                        {m.details && <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{m.details}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-md">{t("noPaymentMethod")}</p>
              )
            )}
          </div>
        )}

        {/* Order summary */}
        <div className="space-y-2">
          <h2 className="font-bold text-sm">{t("yourOrder")}</h2>
          <div className="border rounded-md overflow-hidden text-sm">
            <div className="flex justify-between px-4 py-2 bg-gray-50 font-bold text-xs">
              <span>{t("product")}</span>
              <span>{t("subtotal")}</span>
            </div>
            {items.map((i) => (
              <div key={i.product.id} className="flex justify-between px-4 py-2 border-t">
                <span>{i.product.name[locale]} × {i.quantity}</span>
                <span>{formatPrice(i.product.priceMin * i.quantity, locale)} {locale === "tr" ? "₺" : "TRY"}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2 border-t text-gray-500 text-xs">
              <span>KDV Hariç</span>
              <span>{formatPrice(subtotalBeforeTax, locale)} {locale === "tr" ? "₺" : "TRY"}</span>
            </div>
            <div className="flex justify-between px-4 py-2 border-t text-gray-500 text-xs">
              <span>KDV (%20)</span>
              <span>{formatPrice(taxAmount, locale)} {locale === "tr" ? "₺" : "TRY"}</span>
            </div>
            <div className="flex justify-between px-4 py-3 border-t font-extrabold">
              <span>{t("total")} (KDV Dahil)</span>
              <span className="text-gold">{formatPrice(total, locale)} {locale === "tr" ? "₺" : "TRY"}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500">{t("privacyNote")}</p>
        {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={submitting || gwLoading}
          className="w-full bg-black text-gold py-3 rounded-md font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? t("processing") : (gatewayLabel[gateway] || "Siparişi Onayla")}
        </button>
      </form>
    </section>
  );
}
