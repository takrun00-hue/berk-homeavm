"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/context/LanguageContext";

interface CustomMethod { name: string; details: string; }

export default function AdminPaymentPage() {
  const [form, setForm] = useState({
    active_gateway: "none",
    iyzico_api_key: "",
    iyzico_secret_key: "",
    iyzico_base_url: "",
    paytr_merchant_id: "",
    paytr_merchant_key: "",
    paytr_merchant_salt: "",
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
      });
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

  return (
    <AdminLayout titleKey="adminPayment">
      <div className="max-w-md">
        {loading ? (
          <p className="text-sm text-gray-500">{t("loading")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 bg-white border rounded-md p-3">
              <h2 className="font-bold text-sm">{t("adminActiveGateway")}</h2>
              <select
                name="active_gateway"
                value={form.active_gateway}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="none">{t("adminNoGateway")}</option>
                <option value="iyzico">iyzico</option>
                <option value="paytr">PayTR</option>
              </select>
            </div>

            <div className="space-y-2 bg-white border rounded-md p-3">
              <h2 className="font-bold text-sm">iyzico</h2>
              <input name="iyzico_api_key" placeholder="API Key" value={form.iyzico_api_key} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="iyzico_secret_key" placeholder="Secret Key" value={form.iyzico_secret_key} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="iyzico_base_url" placeholder="https://api.iyzipay.com" value={form.iyzico_base_url} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>

            <div className="space-y-2 bg-white border rounded-md p-3">
              <h2 className="font-bold text-sm">PayTR</h2>
              <input name="paytr_merchant_id" placeholder="Merchant ID" value={form.paytr_merchant_id} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="paytr_merchant_key" placeholder="Merchant Key" value={form.paytr_merchant_key} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="paytr_merchant_salt" placeholder="Merchant Salt" value={form.paytr_merchant_salt} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>

            <div className="bg-white border rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm">Özel Ödeme Yöntemleri</h2>
                <button
                  type="button"
                  onClick={addCustom}
                  className="flex items-center gap-1 text-xs font-bold text-gold bg-black px-2 py-1 rounded"
                >
                  <Plus size={12} /> {t("adminAddPayment")}
                </button>
              </div>
              <p className="text-xs text-gray-400">Havale, IBAN, kapıda ödeme gibi yöntemler ekleyin.</p>

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
                    placeholder={t("adminPaymentName")}
                    value={m.name}
                    onChange={(e) => updateCustom(i, "name", e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm pr-8"
                  />
                  <textarea
                    placeholder={t("adminPaymentDetails")}
                    value={m.details}
                    onChange={(e) => updateCustom(i, "details", e.target.value as string)}
                    rows={2}
                    className="w-full border rounded px-2 py-1.5 text-sm resize-none"
                  />
                </div>
              ))}
            </div>

            {saved && <p className="text-green-600 text-xs">{t("adminSaved")}</p>}

            <button className="w-full bg-black text-gold py-3 rounded-md text-sm font-bold">
              {t("adminSave")}
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
