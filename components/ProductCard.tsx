"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { locale } = useLanguage();
  const { addToCart } = useCart();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative bg-white rounded-md overflow-hidden shadow-sm"
    >
      <Link href={`/product/${product.slug}`}>
        <div className="aspect-square bg-gray-100 overflow-hidden">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name[locale]}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🛋️</div>
          )}
        </div>
      </Link>

      <button className="absolute top-3 right-3 bg-white rounded-full p-2 shadow">
        <Heart size={16} />
      </button>

      <button
        onClick={() => addToCart(product)}
        className="absolute bottom-3 left-3 bg-gold text-black rounded-md p-2 shadow"
      >
        <ShoppingCart size={16} />
      </button>

      <div className="p-3 text-center">
        {(product.discountPercent ?? 0) > 0 && (
          <span className="inline-block bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
            %{product.discountPercent} İNDİRİM
          </span>
        )}
        <h3 className="font-bold text-sm">{product.name[locale]}</h3>
        <p className="text-gray-400 text-xs mt-1">{product.category[locale]}</p>
        {(product.discountPercent ?? 0) > 0 ? (
          <div className="mt-1">
            <p className="text-gray-400 text-xs line-through">
              {formatPrice(product.priceMin, locale)} {locale === "tr" ? "₺" : "TRY"}
            </p>
            <p className="text-red-500 font-extrabold text-sm">
              {formatPrice(Math.round(product.priceMin * (1 - (product.discountPercent ?? 0) / 100)), locale)} {locale === "tr" ? "₺" : "TRY"}
            </p>
          </div>
        ) : (
          <p className="text-gold font-extrabold text-sm mt-1">
            {formatPrice(product.priceMin, locale)} {locale === "tr" ? "₺" : "TRY"}
          </p>
        )}
      </div>
    </motion.div>
  );
}
