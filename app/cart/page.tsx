"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { X, Plus, Minus } from "lucide-react";

export default function CartPage() {
  const { locale, t } = useLanguage();
  const { items, removeFromCart, increaseQuantity, decreaseQuantity } =
    useCart();

  const total = items.reduce(
    (sum, i) => sum + i.product.priceMin * i.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <section className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-extrabold">{t("myCart")}</h1>
        <p className="text-gray-500 text-sm">{t("emptyCart")}</p>
      </section>
    );
  }

  return (
    <section className="py-10 px-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-center mb-6">
        {t("myCart")}
      </h1>

      <div className="space-y-4">
        {items.map(({ product, quantity }) => (
          <div
            key={product.id}
            className="flex items-center gap-4 border rounded-md p-3"
          >
            <div className="w-20 h-20 rounded overflow-hidden shrink-0 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name[locale]}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">{product.name[locale]}</h3>
              <p className="text-gold font-bold text-sm mt-1">
                {formatPrice(product.priceMin, locale)}{" "}
                {locale === "tr" ? "₺" : "TRY"}
              </p>

              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => decreaseQuantity(product.id)}
                  className="w-7 h-7 flex items-center justify-center border rounded-md"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold w-4 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => increaseQuantity(product.id)}
                  className="w-7 h-7 flex items-center justify-center border rounded-md"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <button onClick={() => removeFromCart(product.id)}>
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 flex justify-between items-center font-extrabold">
        <span>{t("total")}</span>
        <span className="text-gold">
          {formatPrice(total, locale)} {locale === "tr" ? "₺" : "TRY"}
        </span>
      </div>

      <Link
        href="/checkout"
        className="block w-full bg-black text-gold text-center py-3 rounded-md font-bold"
      >
        {t("goToCheckout")}
      </Link>
    </section>
  );
}
