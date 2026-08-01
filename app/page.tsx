"use client";

import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import FeaturesSection from "@/components/FeaturesSection";
import ProductGrid from "@/components/ProductGrid";
import { products } from "@/data/products";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <>
      <Hero />
      <Marquee />
      <FeaturesSection />
      <section className="py-12">
        <h2 className="text-center text-2xl font-extrabold mb-2">
          {t("productsTitle")}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8 px-4">
          {t("productsSubtitle")}
        </p>
        <ProductGrid products={products.slice(0, 6)} />
      </section>
    </>
  );
}
