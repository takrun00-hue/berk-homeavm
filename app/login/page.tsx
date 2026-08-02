"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const errMsg =
      tab === "login"
        ? await login(email, password)
        : await register(name, email, password);

    setLoading(false);

    if (errMsg) {
      setError(errMsg);
    } else {
      router.push("/account");
    }
  };

  return (
    <section className="py-16 px-4 max-w-sm mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-center">
        {locale === "tr" ? "Giriş / Kayıt" : "Login / Register"}
      </h1>

      <div className="grid grid-cols-2 border-b">
        <button
          onClick={() => setTab("login")}
          className={`py-3 font-bold text-sm ${
            tab === "login"
              ? "border-b-2 border-gold text-gold"
              : "text-gray-400"
          }`}
        >
          {locale === "tr" ? "Giriş Yap" : "Login"}
        </button>
        <button
          onClick={() => setTab("register")}
          className={`py-3 font-bold text-sm ${
            tab === "register"
              ? "border-b-2 border-gold text-gold"
              : "text-gray-400"
          }`}
        >
          {locale === "tr" ? "Kayıt Ol" : "Register"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {tab === "register" && (
          <input
            placeholder={locale === "tr" ? "Ad Soyad" : "Full Name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />
        <input
          type="password"
          placeholder={locale === "tr" ? "Şifre" : "Password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />

        {tab === "login" && (
          <div className="text-left">
            <Link
              href="/forgot-password"
              className="text-xs text-gray-500 underline"
            >
              {locale === "tr" ? "Şifremi unuttum" : "Forgot password?"}
            </Link>
          </div>
        )}

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-gold py-3 rounded-md font-bold mt-2 disabled:opacity-50"
        >
          {loading
            ? "..."
            : tab === "login"
            ? locale === "tr"
              ? "Giriş Yap"
              : "Login"
            : locale === "tr"
            ? "Kayıt Ol"
            : "Register"}
        </button>
      </form>
    </section>
  );
}
