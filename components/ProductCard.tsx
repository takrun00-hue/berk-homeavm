"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function ProductCard({ product }: { product: Product }) {
  const { locale } = useLanguage();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative bg-white rounded-md overflow-hidden shadow-sm"
    >
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square">
          <Image
            src={product.image}
            alt={product.name[locale]}
            fill
            className="object-cover"
          />
        </div>
      </Link>

      <button className="absolute top-3 right-3 bg-white rounded-full p-2 shadow">
        <Heart size={16} />
      </button>

      <button className="absolute bottom-3 left-3 bg-gold text-black rounded-md p-2 shadow">
        <ShoppingCart size={16} />
      </button>

      <div className="p-3 text-center">
        <h3 className="font-bold text-sm">{product.name[locale]}</h3>
        <p className="text-gray-400 text-xs mt-1">{product.category[locale]}</p>
        <p className="text-gold font-extrabold text-sm mt-1">
          {formatPrice(product.priceMin, locale)} –{" "}
          {formatPrice(product.priceMax, locale)}{" "}
          {locale === "tr" ? "₺" : "TRY"}
        </p>
      </div>
    </motion.div>
  );
}
