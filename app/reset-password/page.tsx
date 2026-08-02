"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t("passwordsNotMatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setError(data.message || "Error.");
    }
  };

  if (!token) {
    return (
      <section className="py-16 px-4 max-w-sm mx-auto text-center">
        <p className="text-red-500 text-sm">{t("invalidLink")}</p>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold text-center">
        {t("setNewPassword")}
      </h1>

      {done ? (
        <p className="text-sm text-green-600 text-center">
          {t("passwordUpdated")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder={t("newPassword")}
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
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder={t("confirmPassword")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border rounded-md px-4 py-3 text-sm"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-gold py-3 rounded-md font-bold disabled:opacity-50"
          >
            {loading ? "..." : t("updatePassword")}
          </button>
        </form>
      )}
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
