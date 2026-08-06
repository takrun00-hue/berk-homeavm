"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

export default function AdminSocialPage() {
  const [form, setForm] = useState({
    social_trendyol: "",
    social_hepsiburada: "",
    social_facebook: "",
    social_whatsapp: "",
  });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setForm({
            social_trendyol: d.settings.social_trendyol || "",
            social_hepsiburada: d.settings.social_hepsiburada || "",
            social_facebook: d.settings.social_facebook || "",
            social_whatsapp: d.settings.social_whatsapp || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
        setSaveError("Kayıt başarısız.");
      }
    } catch {
      setSaveError("Bağlantı hatası.");
    }
  };

  return (
    <AdminLayout titleKey="adminSocial">
      <div className="max-w-md">
        {loading ? (
          <p className="text-sm text-gray-500">Yükleniyor...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 bg-white border rounded-md p-4">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Pazaryeri Linkleri</p>
            <input
              name="social_trendyol"
              placeholder="Trendyol mağaza linki"
              value={form.social_trendyol}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <input
              name="social_hepsiburada"
              placeholder="Hepsiburada mağaza linki"
              value={form.social_hepsiburada}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide pt-1">Sosyal Medya</p>
            <input
              name="social_facebook"
              placeholder="Facebook URL"
              value={form.social_facebook}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <input
              name="social_whatsapp"
              placeholder="WhatsApp URL (https://wa.me/90...)"
              value={form.social_whatsapp}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />

            {saved && <p className="text-green-600 text-xs">Kaydedildi.</p>}
            {saveError && <p className="text-red-500 text-xs">{saveError}</p>}

            <button className="w-full bg-black text-gold py-3 rounded-md text-sm font-bold">
              Kaydet
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
