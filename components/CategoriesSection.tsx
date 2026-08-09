"use client";

import Link from "next/link";
import { useCategories } from "@/lib/useCategories";
import { useLanguage } from "@/context/LanguageContext";

export default function CategoriesSection() {
  const { categories, loading } = useCategories();
  const { locale, t } = useLanguage();

  if (!loading && categories.length === 0) return null;

  return (
    <section className="py-12 px-4">
      <h2 className="text-center text-2xl font-extrabold mb-2">
        {t("categories")}
      </h2>
      <p className="text-center text-gray-500 text-sm mb-8">
        {t("categoriesSubtitle")}
      </p>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group flex items-center justify-center rounded-xl aspect-square bg-gray-800 hover:bg-black shadow-sm transition-colors"
            >
              <span className="text-white font-extrabold text-sm md:text-base text-center px-3">
                {cat.name[locale]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
