"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <section className="py-16 px-4 max-w-2xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-extrabold">{t("aboutTitle")}</h1>
      <p className="text-gray-600 text-sm leading-7">{t("aboutText")}</p>
    </section>
  );
}
