"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    contact_phone: "",
    contact_email: "",
    contact_address: "",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <section className="py-10 px-4 max-w-md mx-auto text-center text-sm text-gray-500">
        Yükleniyor...
      </section>
    );
  }

  return (
    <section className="py-10 px-4 max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-extrabold">İletişim Ayarları</h1>
      <AdminNav />

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          name="contact_phone"
          placeholder="Telefon"
          value={form.contact_phone}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        <input
          name="contact_email"
          placeholder="Email"
          value={form.contact_email}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        <input
          name="contact_address"
          placeholder="Adres"
          value={form.contact_address}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />

        {saved && <p className="text-green-600 text-xs">Kaydedildi.</p>}

        <button className="w-full bg-black text-gold py-3 rounded-md text-sm font-bold">
          Kaydet
        </button>
      </form>
    </section>
  );
}
