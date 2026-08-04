"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/context/LanguageContext";

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
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setForm((f) => ({ ...f, ...d.settings }));
        setLoading(false);
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaved(true);
  };

  return (
    <AdminLayout titleKey="adminPayment">
      <div className="max-w-md">
        {loading ? (
          <p className="text-sm text-gray-500">{t("loading")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white border rounded-md p-3">
            <div className="space-y-2">
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

            <div className="space-y-2 border-t pt-4">
              <h2 className="font-bold text-sm">iyzico</h2>
              <input
                name="iyzico_api_key"
                placeholder="API Key"
                value={form.iyzico_api_key}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <input
                name="iyzico_secret_key"
                placeholder="Secret Key"
                value={form.iyzico_secret_key}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <input
                name="iyzico_base_url"
                placeholder="https://api.iyzipay.com"
                value={form.iyzico_base_url}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2 border-t pt-4">
              <h2 className="font-bold text-sm">PayTR</h2>
              <input
                name="paytr_merchant_id"
                placeholder="Merchant ID"
                value={form.paytr_merchant_id}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <input
                name="paytr_merchant_key"
                placeholder="Merchant Key"
                value={form.paytr_merchant_key}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <input
                name="paytr_merchant_salt"
                placeholder="Merchant Salt"
                value={form.paytr_merchant_salt}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
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
