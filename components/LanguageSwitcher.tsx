"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-1 text-xs font-bold text-white">
      <button
        onClick={() => setLocale("tr")}
        className={locale === "tr" ? "text-gold" : "text-gray-400"}
      >
        TR
      </button>
      <span className="text-gray-500">/</span>
      <button
        onClick={() => setLocale("en")}
        className={locale === "en" ? "text-gold" : "text-gray-400"}
      >
        EN
      </button>
    </div>
  );
}
