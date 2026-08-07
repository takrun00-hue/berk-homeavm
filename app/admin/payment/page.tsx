"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/context/LanguageContext";

interface CustomMethod { name: string; details: string; }

export default function AdminPaymentPage() {
  const [form, setForm] = useState({
    active_gateway: "none",
    // iyzico
    iyzico_api_key: "",
    iyzico_secret_key: "",
    iyzico_base_url: "",
    // PayTR
    paytr_merchant_id: "",
    paytr_merchant_key: "",
    paytr_merchant_salt: "",
    // Stripe
    stripe_secret_key: "",
    stripe_publishable_key: "",
    stripe_webhook_secret: "",
    // PayPal
    paypal_client_id: "",
    paypal_client_secret: "",
    paypal_mode: "sandbox",
  });
  const [customs, setCustoms] = useState<CustomMethod[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setForm((f) => ({ ...f, ...d.settings }));
        try {
          setCustoms(JSON.parse(d.settings.custom_payment_methods || "[]"));
        } catch { setCustoms([]); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const updateCustom = (i: number, field: keyof CustomMethod, val: string) => {
    setCustoms(customs.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
    setSaved(false);
  };

  const addCustom = () => { setCustoms([...customs, { name: "", details: "" }]); setSaved(false); };
  const removeCustom = (i: number) => { setCustoms(customs.filter((_, idx) => idx !== i)); setSaved(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, custom_payment_methods: JSON.stringify(customs) }),
    });
    setSaved(true);
  };

  const Field = ({ name, placeholder, type = "text" }: { name: keyof typeof form; placeholder: string; type?: string }) => (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={form[name]}
      onChange={handleChange}
      className="w-full border rounded-md px-3 py-2 text-sm"
    />
  );

  return (
    <AdminLayout titleKey="adminPayment">
      <div className="max-w-lg">
        {loading ? (
          <p className="text-sm text-gray-500">{t("loading")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Active Gateway */}
            <div className="space-y-2 bg-white border rounded-md p-3">
              <h2 className="font-bold text-sm">{t("adminActiveGateway") || "Aktif Ödeme Yöntemi"}</h2>
              <select
                name="active_gateway"
                value={form.active_gateway}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="none">{t("adminNoGateway") || "Yok"}</option>
                <option value="iyzico">iyzico</option>
                <option value="paytr">PayTR</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {/* iyzico */}
            <div className="space-y-2 bg-white border rounded-md p-3">
              <h2 className="font-bold text-sm">iyzico</h2>
              <p className="text-xs text-gray-400">Türkiye için yerel ödeme altyapısı</p>
              <Field name="iyzico_api_key" placeholder="API Key" />
              <Field name="iyzico_secret_key" placeholder="Secret Key" />
              <Field name="iyzico_base_url" placeholder="Base URL (https://api.iyzipay.com)" />
            </div>

            {/* PayTR */}
            <div className="space-y-2 bg-white border rounded-md p-3">
              <h2 className="font-bold text-sm">PayTR</h2>
              <p className="text-xs text-gray-400">Türkiye için sanal POS altyapısı</p>
              <Field name="paytr_merchant_id" placeholder="Merchant ID" />
              <Field name="paytr_merchant_key" placeholder="Merchant Key" />
              <Field name="paytr_merchant_salt" placeholder="Merchant Salt" />
            </div>

            {/* Stripe */}
            <div className="space-y-2 bg-white border rounded-md p-3">
              <h2 className="font-bold text-sm">Stripe</h2>
              <p className="text-xs text-gray-400">Kredi kartı, Google Pay, Apple Pay destekler</p>
              <Field name="stripe_publishable_key" placeholder="Publishable Key (pk_live_...)" />
              <Field name="stripe_secret_key" placeholder="Secret Key (sk_live_...)" type="password" />
              <Field name="stripe_webhook_secret" placeholder="Webhook Secret (whsec_...)" type="password" />
            </div>

            {/* PayPal */}
            <div className="space-y-2 bg-white border rounded-md p-3">
              <h2 className="font-bold text-sm">PayPal</h2>
              <p className="text-xs text-gray-400">PayPal ve PayPal ile Google Pay desteği</p>
              <Field name="paypal_client_id" placeholder="Client ID" />
              <Field name="paypal_client_secret" placeholder="Client Secret" type="password" />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Mod</label>
                <select
                  name="paypal_mode"
                  value={form.paypal_mode}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="sandbox">Sandbox (Test)</option>
                  <option value="live">Live (Canlı)</option>
                </select>
              </div>
            </div>

            {/* Custom Methods */}
            <div className="bg-white border rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm">Özel Ödeme Yöntemleri</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Havale, IBAN, kapıda ödeme gibi yöntemler</p>
                </div>
                <button
                  type="button"
                  onClick={addCustom}
                  className="flex items-center gap-1 text-xs font-bold text-gold bg-black px-2 py-1 rounded"
                >
                  <Plus size={12} /> {t("adminAddPayment") || "Ekle"}
                </button>
              </div>

              {customs.length === 0 && (
                <p className="text-xs text-gray-400">Henüz özel ödeme yöntemi yok.</p>
              )}

              {customs.map((m, i) => (
                <div key={i} className="border rounded-md p-2 space-y-1.5 relative">
                  <button
                    type="button"
                    onClick={() => removeCustom(i)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                  <input
                    placeholder={t("adminPaymentName") || "Yöntem adı (örn: Havale)"}
                    value={m.name}
                    onChange={(e) => updateCustom(i, "name", e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm pr-8"
                  />
                  <textarea
                    placeholder={t("adminPaymentDetails") || "Detaylar (IBAN, talimatlar...)"}
                    value={m.details}
                    onChange={(e) => updateCustom(i, "details", e.target.value)}
                    rows={2}
                    className="w-full border rounded px-2 py-1.5 text-sm resize-none"
                  />
                </div>
              ))}
            </div>

            {saved && <p className="text-green-600 text-xs font-semibold">{t("adminSaved") || "Kaydedildi ✓"}</p>}

            <button className="w-full bg-black text-gold py-3 rounded-md text-sm font-bold">
              {t("adminSave") || "Kaydet"}
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
