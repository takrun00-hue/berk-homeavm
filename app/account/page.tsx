"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function AccountPage() {
  const { user, logout, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) return null;

  if (!user) {
    return (
      <section className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-extrabold">{t("myAccount")}</h1>
        <p className="text-gray-500 text-sm">{t("notLoggedIn")}</p>
        <Link
          href="/login"
          className="inline-block bg-black text-gold px-6 py-3 rounded-md font-bold"
        >
          {t("loginRegister")}
        </Link>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
      <h1 className="text-2xl font-extrabold">{t("myAccount")}</h1>
      <p className="text-gray-700 text-sm">{user.name}</p>
      <p className="text-gray-400 text-xs">{user.email}</p>
      <button
        onClick={logout}
        className="inline-block bg-black text-gold px-6 py-3 rounded-md font-bold mt-4"
      >
        {t("logout")}
      </button>
    </section>
  );
}
