"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function FavoritesPage() {
  const { locale } = useLanguage();

  return (
    <section className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
      <h1 className="text-2xl font-extrabold">
        {locale === "tr" ? "Favorilerim" : "My Favorites"}
      </h1>
      <p className="text-gray-500 text-sm">
        {locale === "tr"
          ? "Henüz favori ürününüz yok."
          : "You have no favorite products yet."}
      </p>
    </section>
  );
}
