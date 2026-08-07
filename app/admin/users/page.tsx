"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

interface User {
  id: number;
  name: string;
  email: string;
  discount_percent: number;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [discounts, setDiscounts] = useState<Record<number, string>>({});

  const load = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        const list: User[] = d.users || [];
        setUsers(list);
        const map: Record<number, string> = {};
        list.forEach((u) => { map[u.id] = String(u.discount_percent); });
        setDiscounts(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (userId: number) => {
    setSaving(userId);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discount_percent: Number(discounts[userId]) || 0 }),
    });
    setSaving(null);
    load();
  };

  return (
    <AdminLayout titleKey="adminUsers">
      <div className="max-w-xl space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Yükleniyor...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz kayıtlı üye yok.</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="border rounded-md p-3 bg-white flex flex-col gap-2">
              <div>
                <p className="font-bold text-sm">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
                <p className="text-xs text-gray-400">
                  {new Date(u.created_at).toLocaleDateString("tr-TR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 whitespace-nowrap">
                  İndirim (%):
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discounts[u.id] ?? "0"}
                  onChange={(e) =>
                    setDiscounts((d) => ({ ...d, [u.id]: e.target.value }))
                  }
                  className="border rounded px-2 py-1 text-sm w-20"
                />
                <button
                  onClick={() => handleSave(u.id)}
                  disabled={saving === u.id}
                  className="bg-black text-gold px-3 py-1 rounded text-xs font-bold disabled:opacity-50"
                >
                  {saving === u.id ? "..." : "Kaydet"}
                </button>
                {u.discount_percent > 0 && (
                  <span className="text-xs text-green-600 font-bold">
                    %{u.discount_percent} aktif
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
