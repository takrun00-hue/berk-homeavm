"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function AccountPage() {
  const { locale } = useLanguage();

  return (
    <section className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
      <h1 className="text-2xl font-extrabold">
        {locale === "tr" ? "Hesabım" : "My Account"}
      </h1>
      <p className="text-gray-500 text-sm">
        {locale === "tr"
          ? "Giriş yapmadınız."
          : "You are not logged in."}
      </p>
    </section>
  );
}
