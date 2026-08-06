"use client";

import Link from "next/link";
import { useCategories } from "@/lib/useCategories";
import { useLanguage } from "@/context/LanguageContext";

export default function CategoriesSection() {
  const { categories, loading } = useCategories();
  const { locale, t } = useLanguage();

  if (loading || categories.length === 0) return null;

  return (
    <section className="py-12 px-4">
      <h2 className="text-center text-2xl font-extrabold mb-2">
        {t("categories")}
      </h2>
      <p className="text-center text-gray-500 text-sm mb-8">
        {t("categoriesSubtitle")}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="group relative overflow-hidden rounded-xl aspect-square bg-gray-100 shadow-sm"
          >
            {cat.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cat.image}
                alt={cat.name[locale]}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-4xl">
                🛋️
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
            <div className="absolute inset-0 flex items-end p-4">
              <span className="text-white font-extrabold text-sm md:text-base drop-shadow">
                {cat.name[locale]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
