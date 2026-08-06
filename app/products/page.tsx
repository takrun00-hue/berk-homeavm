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
    <section className="py-10">
      <h1 className="text-center text-2xl font-extrabold mb-4">
        {categorySlug
          ? categories.find((c) => c.slug === categorySlug)?.name[locale] ?? categorySlug
          : t("shop")}
      </h1>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-4 mb-4">
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
            {cat.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cat.image}
                alt={cat.name[locale]}
                className="w-5 h-5 rounded-full object-cover"
              />
            )}
            {cat.name[locale]}
          </Link>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-400">{t("loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-10">
          {t("noProducts") || "Ürün bulunamadı."}
        </p>
      ) : (
        <ProductGrid products={filtered} />
      )}
    </section>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="text-center py-10 text-sm text-gray-400">Yükleniyor...</p>}>
      <ProductsContent />
    </Suspense>
  );
}
