"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/products", label: "Ürünler" },
  { href: "/admin/categories", label: "Kategoriler" },
  { href: "/admin/settings", label: "İletişim" },
  { href: "/admin/payment", label: "Ödeme" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-3 text-xs border-b pb-2 overflow-x-auto">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            pathname === l.href
              ? "bg-black text-gold font-bold"
              : "text-gray-500"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
