"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login, register } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (tab === "login") {
      const ok = login(email, password);
      if (ok) {
        router.push("/account");
      } else {
        setError(
          locale === "tr"
            ? "Email veya şifre hatalı."
            : "Incorrect email or password."
        );
      }
    } else {
      if (!name || !email || !password) {
        setError(locale === "tr" ? "Tüm alanları doldurun." : "Fill all fields.");
        return;
      }
      const ok = register(name, email, password);
      if (ok) {
        router.push("/account");
      } else {
        setError(
          locale === "tr"
            ? "Bu email zaten kayıtlı."
            : "This email is already registered."
        );
      }
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

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          className="w-full bg-black text-gold py-3 rounded-md font-bold mt-2"
        >
          {tab === "login"
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
