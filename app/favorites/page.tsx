"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function FavoritesPage() {
  const { t } = useLanguage();

  return (
    <section className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
      <h1 className="text-2xl font-extrabold">{t("myFavorites")}</h1>
      <p className="text-gray-500 text-sm">{t("noFavorites")}</p>
    </section>
  );
}
