"use client";

import Link from "next/link";
import { Store, Heart, ShoppingCart, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function MobileBottomNav() {
  const { t } = useLanguage();

  const items = [
    { label: t("shop"), href: "/products", icon: Store },
    { label: t("favorites"), href: "/favorites", icon: Heart },
    { label: t("cart"), href: "/cart", icon: ShoppingCart },
    { label: t("account"), href: "/account", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t md:hidden">
      <ul className="flex justify-between px-4 py-2">
        {items.map(({ label, href, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex flex-col items-center gap-1 text-xs font-bold"
            >
              <Icon size={20} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
