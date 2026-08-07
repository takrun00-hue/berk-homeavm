"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import ProductCard from "./ProductCard";

export default function SaleSection() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/sale?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-12 bg-red-50">
      <div className="px-4">
        <h2 className="text-center text-2xl font-extrabold mb-1 text-red-600">
          {t("saleTitle")}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8 px-4">
          {t("saleSubtitle")}
        </p>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
