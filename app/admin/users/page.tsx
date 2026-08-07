"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

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

  const handleDelete = async (userId: number, name: string) => {
    if (!confirm(`"${name}" adlı kullanıcıyı silmek istediğinize emin misiniz?`)) return;
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    load();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true); setAddError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    setAdding(false);
    if (res.ok && data.success) {
      setNewUser({ name: "", email: "", password: "" });
      setShowAdd(false);
      load();
    } else {
      setAddError(data.error || "Hata oluştu.");
    }
  };

  return (
    <AdminLayout titleKey="adminUsers">
      <div className="max-w-xl space-y-4">
        <button
          onClick={() => { setShowAdd(!showAdd); setAddError(""); }}
          className="flex items-center gap-2 bg-black text-gold px-4 py-2 rounded-md text-sm font-bold"
        >
          <Plus size={15} />
          Kullanıcı Ekle
          {showAdd ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white border rounded-md p-3 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Yeni Kullanıcı</p>
            <input
              placeholder="Ad Soyad"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Şifre (en az 6 karakter)"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              minLength={6}
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            {addError && <p className="text-red-500 text-xs">{addError}</p>}
            <button
              type="submit"
              disabled={adding}
              className="w-full bg-black text-gold py-2 rounded-md text-sm font-bold disabled:opacity-50"
            >
              {adding ? "Ekleniyor..." : "Ekle"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Yükleniyor...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz kayıtlı üye yok.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="border rounded-md p-3 bg-white space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    className="text-red-400 hover:text-red-600 shrink-0 mt-0.5"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 whitespace-nowrap">İndirim (%):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discounts[u.id] ?? "0"}
                    onChange={(e) => setDiscounts((d) => ({ ...d, [u.id]: e.target.value }))}
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
                    <span className="text-xs text-green-600 font-bold">%{u.discount_percent} aktif</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
