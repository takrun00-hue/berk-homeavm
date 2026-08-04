"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      setError(t("adminWrongPassword"));
    }
  };

  return (
    <section className="py-20 px-4 max-w-sm mx-auto space-y-4">
      <div className="flex justify-end gap-1 text-xs font-bold">
        <button
          onClick={() => setLocale("tr")}
          className={locale === "tr" ? "text-gold" : "text-gray-400"}
        >
          TR
        </button>
        <span className="text-gray-300">/</span>
        <button
          onClick={() => setLocale("en")}
          className={locale === "en" ? "text-gold" : "text-gray-400"}
        >
          EN
        </button>
      </div>
      <h1 className="text-2xl font-extrabold text-center">
        {t("adminLoginTitle")}
      </h1>
      <form onSubmit={handleLogin} className="space-y-3">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t("adminPasswordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md px-4 py-3 text-sm pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-gold py-3 rounded-md font-bold disabled:opacity-50"
        >
          {loading ? "..." : t("adminLoginButton")}
        </button>
      </form>
    </section>
  );
}
