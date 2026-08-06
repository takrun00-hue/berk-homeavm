"use client";

import { useState, useEffect } from "react";
import { Search, Heart, User, Shuffle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Category } from "@/types";

export default function HamburgerMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"menu" | "categories">("menu");
  const [categories, setCategories] = useState<Category[]>([]);
  const { locale, t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    fetch(`/api/categories?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then((r) => r.json())
      .then((d) => { if (d.categories) setCategories(d.categories); })
      .catch(() => {});
  }, [open]);

  const menuItems = [
    { label: t("home"), href: "/" },
    { label: t("about"), href: "/about" },
    { label: t("shop"), href: "/products" },
    { label: t("contact"), href: "/contact" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween" }}
            className="fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white z-50 overflow-y-auto"
          >
            <div className="flex items-center gap-2 p-4 border-b">
              <Search size={20} className="text-gray-400" />
              <input
                placeholder={t("search")}
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 border-b">
              <button
                onClick={() => setTab("menu")}
                className={`py-3 font-bold text-sm ${
                  tab === "menu"
                    ? "border-b-2 border-gold text-gold"
                    : "text-gray-400"
                }`}
              >
                {t("menu")}
              </button>
              <button
                onClick={() => setTab("categories")}
                className={`py-3 font-bold text-sm ${
                  tab === "categories"
                    ? "border-b-2 border-gold text-gold"
                    : "text-gray-400"
                }`}
              >
                {t("categories")}
              </button>
            </div>

            {tab === "menu" ? (
              <ul>
                {menuItems.map((item) => (
                  <li key={item.href} className="border-b">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block px-4 py-4 font-bold text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li className="border-b">
                  <Link
                    href="/favorites"
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-4 font-bold text-sm"
                  >
                    <Heart size={16} /> {t("favorites")}
                  </Link>
                </li>
                <li className="border-b">
                  <span className="flex items-center gap-2 px-4 py-4 font-bold text-sm text-gray-400">
                    <Shuffle size={16} /> {t("compare")}
                  </span>
                </li>
                <li className="border-b">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-4 font-bold text-sm"
                  >
                    <User size={16} /> {t("login")}
                  </Link>
                </li>
              </ul>
            ) : (
              <ul>
                {categories.length === 0 ? (
                  <li className="px-4 py-4 text-sm text-gray-400">
                    {t("loading")}
                  </li>
                ) : (
                  categories.map((cat) => (
                    <li key={cat.id} className="border-b">
                      <Link
                        href={`/products?category=${cat.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 font-bold text-sm"
                      >
                        {cat.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cat.image}
                            alt={cat.name[locale]}
                            className="w-8 h-8 rounded object-cover border"
                          />
                        )}
                        {cat.name[locale]}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
