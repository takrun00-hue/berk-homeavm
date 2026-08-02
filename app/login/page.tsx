"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { t } = useLanguage();
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
        {t("loginRegister")}
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
          {t("loginTab")}
        </button>
        <button
          onClick={() => setTab("register")}
          className={`py-3 font-bold text-sm ${
            tab === "register"
              ? "border-b-2 border-gold text-gold"
              : "text-gray-400"
          }`}
        >
          {t("registerTab")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {tab === "register" && (
          <input
            placeholder={t("fullName")}
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
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t("password")}
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

        {tab === "login" && (
          <div className="text-left">
            <Link
              href="/forgot-password"
              className="text-xs text-gray-500 underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
        )}

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-gold py-3 rounded-md font-bold mt-2 disabled:opacity-50"
        >
          {loading ? "..." : tab === "login" ? t("loginTab") : t("registerTab")}
        </button>
      </form>
    </section>
  );
}
