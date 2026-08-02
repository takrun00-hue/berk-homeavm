"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/lib/useProducts";
import { useState } from "react";

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { locale, t } = useLanguage();
  const { addToCart } = useCart();
  const { products, loading } = useProducts();
  const [added, setAdded] = useState(false);

  const product = products.find((p) => p.slug === params.slug);

  const handleAdd = () => {
    if (!product) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (loading) {
    return (
      <section className="py-16 px-4 text-center text-sm text-gray-500">
        {t("loading")}
      </section>
    );
  }

  if (!product) {
    return (
      <section className="py-16 px-4 text-center text-sm text-gray-500">
        {t("productNotFound")}
      </section>
    );
  }

  return (
    <section className="py-10 px-4 max-w-3xl mx-auto space-y-6">
      <div className="relative aspect-square rounded-md overflow-hidden">
        <Image
          src={product.image}
          alt={product.name[locale]}
          fill
          className="object-cover"
        />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold">{product.name[locale]}</h1>
        <p className="text-gray-400">{product.category[locale]}</p>
        <p className="text-gold font-extrabold text-lg">
          {formatPrice(product.priceMin, locale)} –{" "}
          {formatPrice(product.priceMax, locale)}{" "}
          {locale === "tr" ? "₺" : "TRY"}
        </p>
        <p className="text-gray-600 text-sm">{product.description[locale]}</p>
        <button
          onClick={handleAdd}
          className="bg-black text-gold px-6 py-3 rounded-md font-bold mt-4"
        >
          {added ? "✓" : t("addToCart")}
        </button>
      </div>
    </section>
  );
}
