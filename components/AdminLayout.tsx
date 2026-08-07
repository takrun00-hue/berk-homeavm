"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Phone,
  CreditCard,
  ImageUp,
  Share2,
  LogOut,
  Menu,
  X,
  Users,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminLayout({
  children,
  titleKey,
}: {
  children: React.ReactNode;
  titleKey:
    | "adminDashboard"
    | "adminProducts"
    | "adminCategories"
    | "adminContact"
    | "adminPayment"
    | "adminUpload"
    | "adminSocial"
    | "adminUsers";
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();

  // جلوگیری از رفتن به صفحات عادی سایت وقتی در پنل ادمین هستیم
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (
        anchor &&
        anchor.href &&
        !anchor.href.includes("/admin") &&
        anchor.target !== "_blank"
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  const links = [
    { href: "/admin/dashboard", labelKey: "adminDashboard" as const, icon: LayoutDashboard },
    { href: "/admin/products", labelKey: "adminProducts" as const, icon: Package },
    { href: "/admin/categories", labelKey: "adminCategories" as const, icon: Tags },
    { href: "/admin/settings", labelKey: "adminContact" as const, icon: Phone },
    { href: "/admin/payment", labelKey: "adminPayment" as const, icon: CreditCard },
    { href: "/admin/social", labelKey: "adminSocial" as const, icon: Share2 },
    { href: "/admin/users", labelKey: "adminUsers" as const, icon: Users },
    { href: "/admin/upload", labelKey: "adminUpload" as const, icon: ImageUp },
  ];

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-black text-white transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:block`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <span className="font-extrabold text-gold text-sm">
            BERK-HOMEAVM Admin
          </span>
          <button onClick={() => setOpen(false)} className="md:hidden">
            <X size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                  active
                    ? "bg-gold text-black font-bold"
                    : "text-gray-300 hover:bg-gray-900"
                }`}
              >
                <Icon size={18} />
                {t(l.labelKey)}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-gray-900 w-full mt-4 border-t border-gray-800 pt-4"
          >
            <LogOut size={18} />
            {t("adminLogout")}
          </button>
        </nav>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 md:ml-0">
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="md:hidden">
              <Menu size={22} />
            </button>
            <h1 className="font-extrabold text-lg">{t(titleKey)}</h1>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setLocale("tr")}
              className={locale === "tr" ? "text-gold" : "text-gray-400"}
            >
              TR
            </button>
            <span className="text-gray-300">/</span>
            <button
              onClick={() => setLocale("en")}
              className={locale === "en" ? "text-gold" : "text-gray-400"}
            >
              EN
            </button>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
