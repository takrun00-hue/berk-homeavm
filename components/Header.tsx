"use client";

import { useState } from "react";
import { Menu, ShoppingCart, Home } from "lucide-react";
import Link from "next/link";
import HamburgerMenu from "./HamburgerMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-30 bg-black h-[90px] flex items-center justify-between px-4">
        <button
          onClick={() => setMenuOpen(true)}
          className="flex items-center gap-2 text-white"
        >
          <Menu size={22} />
          <span className="text-sm font-bold">{t("menu")}</span>
        </button>

        <Link href="/" className="flex flex-col items-center leading-none">
          <Home size={28} className="text-gold" />
          <span className="text-gold font-extrabold text-lg -mt-1">
            {t("brand")}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link href="/cart" className="relative text-white">
            <ShoppingCart size={22} />
            <span className="absolute -top-2 -right-2 bg-gold text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              0
            </span>
          </Link>
        </div>
      </header>

      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="h-[90px]" />
    </>
  );
}
