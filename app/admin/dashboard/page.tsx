"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Package, Tags, Users } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    productCount: 0,
    categoryCount: 0,
    userCount: 0,
  });

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d));
  }, []);

  const cards = [
    { label: "Toplam Ürün", value: stats.productCount, icon: Package },
    { label: "Toplam Kategori", value: stats.categoryCount, icon: Tags },
    { label: "Toplam Kullanıcı", value: stats.userCount, icon: Users },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="bg-white rounded-lg border p-4 flex items-center gap-4"
            >
              <div className="bg-black text-gold rounded-full p-3">
                <Icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
