"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

export default function AdminSocialPage() {
  const [form, setForm] = useState({
    social_instagram: "",
    social_facebook: "",
    social_whatsapp: "",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setForm({
          social_instagram: d.settings.social_instagram || "",
          social_facebook: d.settings.social_facebook || "",
          social_whatsapp: d.settings.social_whatsapp || "",
        });
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <AdminLayout titleKey="adminSocial">
      <div className="max-w-md">
        {loading ? (
          <p className="text-sm text-gray-500">Yükleniyor...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2 bg-white border rounded-md p-3">
            <input
              name="social_instagram"
              placeholder="Instagram URL"
              value={form.social_instagram}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
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

            <button className="w-full bg-black text-gold py-3 rounded-md text-sm font-bold">
              Kaydet
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
