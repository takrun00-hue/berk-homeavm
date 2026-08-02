"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    setSent(true);
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <section className="py-16 px-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold text-center mb-6">
        {t("contactTitle")}
      </h1>

      {sent ? (
        <p className="text-sm text-green-600 text-center">
          {t("contactSent")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            required
            placeholder={t("formName")}
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />
          <input
            name="phone"
            placeholder={t("formPhone")}
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />
          <textarea
            name="message"
            required
            placeholder={t("formMessage")}
            rows={4}
            value={form.message}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-gold py-3 rounded-md font-bold disabled:opacity-50"
          >
            {loading ? "..." : t("formSubmit")}
          </button>
        </form>
      )}
    </section>
  );
}
