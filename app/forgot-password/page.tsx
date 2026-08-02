"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    setSent(true);
  };

  return (
    <section className="py-16 px-4 max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold text-center">
        {t("forgotPasswordTitle")}
      </h1>

      {sent ? (
        <p className="text-sm text-gray-600 text-center">
          {t("resetLinkSent")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-gold py-3 rounded-md font-bold disabled:opacity-50"
          >
            {loading ? "..." : t("sendResetLink")}
          </button>
        </form>
      )}
    </section>
  );
}
