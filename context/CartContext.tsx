"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { X, Plus, Minus } from "lucide-react";

export default function CartPage() {
  const { locale } = useLanguage();
  const { items, removeFromCart, increaseQuantity, decreaseQuantity } =
    useCart();

  const total = items.reduce(
    (sum, i) => sum + i.product.priceMin * i.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <section className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-extrabold">
          {locale === "tr" ? "Sepetim" : "My Cart"}
        </h1>
        <p className="text-gray-500 text-sm">
          {locale === "tr" ? "Sepetiniz boş." : "Your cart is empty."}
        </p>
      </section>
    );
  }

  return (
    <section className="py-10 px-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-center mb-6">
        {locale === "tr" ? "Sepetim" : "My Cart"}
      </h1>

      <div className="space-y-4">
        {items.map(({ product, quantity }) => (
          <div
            key={product.id}
            className="flex items-center gap-4 border rounded-md p-3"
          >
            <div className="relative w-20 h-20 rounded overflow-hidden shrink-0">
              <Image
                src={product.image}
                alt={product.name[locale]}
                fill
                className="object-cover"
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
        <span>{locale === "tr" ? "Toplam" : "Total"}</span>
        <span className="text-gold">
          {formatPrice(total, locale)} {locale === "tr" ? "₺" : "TRY"}
        </span>
      </div>

      <Link
        href="/checkout"
        className="block w-full bg-black text-gold text-center py-3 rounded-md font-bold"
      >
        {locale === "tr" ? "Ödemeye Geç" : "Go to Checkout"}
      </Link>
    </section>
  );
}
