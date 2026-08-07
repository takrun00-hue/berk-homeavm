"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ProductGrid from "@/components/ProductGrid";
import { useProducts } from "@/lib/useProducts";
import { useCategories } from "@/lib/useCategories";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

function ProductsContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { locale, t } = useLanguage();

  const filtered = categorySlug
    ? products.filter((p) => {
        const cat = categories.find((c) => c.slug === categorySlug);
        return cat
          ? p.category.tr === cat.name.tr || p.category.en === cat.name.en
          : false;
      })
    : products;

  const loading = productsLoading || categoriesLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 flex gap-8">
      {/* Sidebar */}
      <aside className="hidden md:block w-52 shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-2">
          {t("categories") || "Kategoriler"}
        </h2>
        <nav className="flex flex-col gap-1">
          <Link
            href="/products"
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              !categorySlug
                ? "bg-black text-gold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t("allProducts") || "Tümü"}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                categorySlug === cat.slug
                  ? "bg-black text-gold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.image}
                  alt={cat.name[locale]}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              )}
              {cat.name[locale]}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile: horizontal chips */}
      <div className="md:hidden w-full">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          <Link
            href="/products"
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold border ${
              !categorySlug
                ? "bg-black text-gold border-black"
                : "border-gray-300 text-gray-600"
            }`}
          >
            {t("allProducts") || "Tümü"}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border ${
                categorySlug === cat.slug
                  ? "bg-black text-gold border-black"
                  : "border-gray-300 text-gray-600"
              }`}
            >
              {cat.name[locale]}
            </Link>
          ))}
        </div>

        <h1 className="text-xl font-extrabold mb-4">
          {categorySlug
            ? categories.find((c) => c.slug === categorySlug)?.name[locale] ?? categorySlug
            : t("shop")}
        </h1>

        {loading ? (
          <p className="text-center text-sm text-gray-400">{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">
            {t("noProducts") || "Ürün bulunamadı."}
          </p>
        ) : (
          <ProductGrid products={filtered} />
        )}
      </div>

      {/* Desktop: main content */}
      <main className="hidden md:block flex-1 min-w-0">
        <h1 className="text-2xl font-extrabold mb-6">
          {categorySlug
            ? categories.find((c) => c.slug === categorySlug)?.name[locale] ?? categorySlug
            : t("shop")}
        </h1>

        {loading ? (
          <p className="text-center text-sm text-gray-400">{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">
            {t("noProducts") || "Ürün bulunamadı."}
          </p>
        ) : (
          <ProductGrid products={filtered} />
        )}
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="text-center py-10 text-sm text-gray-400">Yükleniyor...</p>}>
      <ProductsContent />
    </Suspense>
  );
}
