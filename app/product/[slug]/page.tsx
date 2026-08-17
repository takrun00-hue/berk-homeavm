"use client";

import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/lib/useProducts";
import { productUnitPrice } from "@/lib/pricing";
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
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const product = products.find((p) => p.slug === decodeURIComponent(params.slug));

  const handleAdd = () => {
    if (!product) return;
    if (product.stock === 0) return; // sold out
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

  const displayImage =
    selectedVariantIdx !== null && product.variants?.[selectedVariantIdx]?.image
      ? product.variants[selectedVariantIdx].image
      : product.image;

  // Tracked per URL so one broken image does not blank out the others.
  const imageFailed = !!failedImages[displayImage];
  const setImageFailed = (failed: boolean) =>
    setFailedImages((prev) => ({ ...prev, [displayImage]: failed }));

  const discountPct = product.discountPercent ?? 0;
  const discountedPrice = discountPct > 0 ? productUnitPrice(product) : null;

  return (
    <section className="py-10 px-4 max-w-3xl mx-auto space-y-6">
      <div className="aspect-square rounded-md overflow-hidden bg-gray-100">
        {displayImage && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            // Keyed on the src so switching colour remounts the element; a
            // previous load failure must not keep the new image hidden.
            key={displayImage}
            src={displayImage}
            alt={product.name[locale]}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">🛋️</div>
        )}
        {discountPct > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            %{discountPct} İNDİRİM
          </span>
        )}
      </div>

      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-700">Renk Seçin:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedVariantIdx(null)}
              className={`w-9 h-9 rounded-full border-2 overflow-hidden transition-all ${
                selectedVariantIdx === null ? "border-black scale-110" : "border-gray-300"
              }`}
              title="Varsayılan"
            >
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image} alt="default" className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            </button>
            {product.variants.map((v, i) => (
              <button
                key={i}
                onClick={() => setSelectedVariantIdx(i)}
                className={`w-9 h-9 rounded-full border-2 transition-all ${
                  selectedVariantIdx === i ? "border-black scale-110" : "border-gray-300"
                }`}
                style={{ backgroundColor: v.hex }}
                title={v.name}
              />
            ))}
          </div>
          {selectedVariantIdx !== null && (
            <p className="text-xs text-gray-500">
              Seçili renk: <span className="font-bold">{product.variants[selectedVariantIdx].name}</span>
            </p>
          )}
        </div>
      )}

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold">{product.name[locale]}</h1>
        <p className="text-gray-400">{product.category[locale]}</p>
        {discountedPrice ? (
          <div>
            <p className="text-gray-400 line-through text-sm">
              {formatPrice(product.priceMin, locale)} {locale === "tr" ? "₺" : "TRY"}
            </p>
            <p className="text-red-500 font-extrabold text-xl">
              {formatPrice(discountedPrice, locale)} {locale === "tr" ? "₺" : "TRY"}
            </p>
          </div>
        ) : (
          <p className="text-gold font-extrabold text-lg">
            {formatPrice(product.priceMin, locale)} {locale === "tr" ? "₺" : "TRY"}
          </p>
        )}
        <p className="text-gray-600 text-sm">{product.description[locale]}</p>
        {/* Stock is shown only when the admin tracks it (stock is a number).
            0 means sold out and blocks adding to the cart. */}
        {typeof product.stock === "number" && (
          product.stock > 0 ? (
            <p className="text-sm font-semibold text-green-600">
              {locale === "tr"
                ? `Stokta ${product.stock} adet`
                : `${product.stock} in stock`}
            </p>
          ) : (
            <p className="text-sm font-bold text-red-500">
              {locale === "tr" ? "Tükendi" : "Out of stock"}
            </p>
          )
        )}
        <button
          onClick={handleAdd}
          disabled={product.stock === 0}
          className="bg-black text-gold px-6 py-3 rounded-md font-bold mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {product.stock === 0
            ? locale === "tr" ? "Tükendi" : "Out of stock"
            : added ? "✓" : t("addToCart")}
        </button>
      </div>
    </section>
  );
}
