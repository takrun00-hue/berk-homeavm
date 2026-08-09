"use client";

import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import FeaturesSection from "@/components/FeaturesSection";
import ProductGrid from "@/components/ProductGrid";
import SaleSection from "@/components/SaleSection";
import { useProducts } from "@/lib/useProducts";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();
  const { products, loading } = useProducts();

  return (
    <>
      <Hero />
      <Marquee />
      <FeaturesSection />
      <SaleSection />
<section className="py-12">
        <h2 className="text-center text-2xl font-extrabold mb-2">
          {t("productsTitle")}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8 px-4">
          {t("productsSubtitle")}
        </p>
        {loading ? (
          <p className="text-center text-sm text-gray-400">{t("loading")}</p>
        ) : (
          <ProductGrid products={products.slice(0, 6)} />
        )}
      </section>
    </>
  );
}
