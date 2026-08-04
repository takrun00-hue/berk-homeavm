"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Phone,
  CreditCard,
  ImageUp,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Ürünler", icon: Package },
  { href: "/admin/categories", label: "Kategoriler", icon: Tags },
  { href: "/admin/settings", label: "İletişim", icon: Phone },
  { href: "/admin/payment", label: "Ödeme", icon: CreditCard },
  { href: "/admin/upload", label: "Görsel Yükle", icon: ImageUp },
];

export default function AdminLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
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
                {l.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-gray-900 w-full mt-4 border-t border-gray-800 pt-4"
          >
            <LogOut size={18} />
            Çıkış Yap
          </button>
        </nav>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-0">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setOpen(true)} className="md:hidden">
            <Menu size={22} />
          </button>
          <h1 className="font-extrabold text-lg">{title}</h1>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
