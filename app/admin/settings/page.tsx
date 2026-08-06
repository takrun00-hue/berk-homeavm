"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    contact_phone: "",
    contact_email: "",
    contact_address: "",
  });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setForm((f) => ({
          contact_phone: d.settings.contact_phone || "",
          contact_email: d.settings.contact_email || "",
          contact_address: d.settings.contact_address || "",
        }));
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
    setSaveError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaved(true);
      } else {
        setSaveError(data.error || data.message || "Kayıt başarısız.");
      }
    } catch {
      setSaveError("Bağlantı hatası.");
    }
  };

  return (
    <AdminLayout titleKey="adminContact">
      <div className="max-w-md">
        {loading ? (
          <p className="text-sm text-gray-500">{t("loading")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2 bg-white border rounded-md p-3">
            <input
              name="contact_phone"
              placeholder={t("adminPhone")}
              value={form.contact_phone}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <input
              name="contact_email"
              placeholder={t("adminEmail")}
              value={form.contact_email}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <input
              name="contact_address"
              placeholder={t("adminAddress")}
              value={form.contact_address}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />

            {saved && <p className="text-green-600 text-xs">{t("adminSaved")}</p>}
            {saveError && <p className="text-red-500 text-xs">{saveError}</p>}

            <button className="w-full bg-black text-gold py-3 rounded-md text-sm font-bold">
              {t("adminSave")}
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
