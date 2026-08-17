"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Trash2, Pencil, Plus, X } from "lucide-react";

interface Company {
  id: number;
  name: string;
  tracking_url: string;
  phone: string;
  is_active: boolean;
}

const EMPTY = { name: "", tracking_url: "", phone: "" };

export default function CargoCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<Company | null>(null);
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch("/api/admin/cargo-companies")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setCompanies(d.companies || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // The cargo_companies table is created by the shared migrate route.
    fetch("/api/admin/migrate")
      .catch(() => {})
      .finally(load);
  }, []);

  const save = async () => {
    if (!form.name.trim()) {
      setMsg("Firma adı gerekli.");
      return;
    }
    const url = editing
      ? `/api/admin/cargo-companies/${editing.id}`
      : "/api/admin/cargo-companies";
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editing ? { ...form, is_active: editing.is_active } : form
      ),
    });
    const d = await res.json();
    if (d.error) {
      setMsg("Hata: " + d.error);
      return;
    }
    setMsg(editing ? "Güncellendi ✓" : "Eklendi ✓");
    setForm(EMPTY);
    setEditing(null);
    load();
    setTimeout(() => setMsg(""), 2000);
  };

  const toggleActive = async (c: Company) => {
    await fetch(`/api/admin/cargo-companies/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: c.name,
        tracking_url: c.tracking_url,
        phone: c.phone,
        is_active: !c.is_active,
      }),
    });
    load();
  };

  const del = async (c: Company) => {
    if (!confirm(`"${c.name}" silinsin mi?`)) return;
    const res = await fetch(`/api/admin/cargo-companies/${c.id}`, {
      method: "DELETE",
    });
    const d = await res.json();
    if (d.error) setMsg("Hata: " + d.error);
    load();
  };

  const startEdit = (c: Company) => {
    setEditing(c);
    setForm({ name: c.name, tracking_url: c.tracking_url, phone: c.phone });
    setMsg("");
  };

  return (
    <AdminLayout titleKey="adminCargoCompanies">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm text-gray-500 mb-6">
          Buraya eklediğiniz firmalar, Kargo Yönetimi sayfasındaki firma
          listesinde görünür.
        </p>

        {/* Form */}
        <div className="bg-white border rounded-xl p-5 mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm uppercase tracking-wider text-gray-500">
              {editing ? `Düzenle: ${editing.name}` : "Yeni Firma Ekle"}
            </h2>
            {editing && (
              <button
                onClick={() => {
                  setEditing(null);
                  setForm(EMPTY);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Firma adı (örn: Yurtiçi Kargo)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Takip URL şablonu (opsiyonel)"
            value={form.tracking_url}
            onChange={(e) =>
              setForm((f) => ({ ...f, tracking_url: e.target.value }))
            }
          />
          <p className="text-xs text-gray-400">
            URL içine <code className="bg-gray-100 px-1 rounded">
              {"{tracking_number}"}
            </code>{" "}
            yazarsanız takip numarasıyla otomatik doldurulur. Örnek:
            https://kargo.com/takip/{"{tracking_number}"}
          </p>
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Telefon (opsiyonel)"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              className="bg-black text-white text-sm px-4 py-2 rounded-md font-bold flex items-center gap-1.5"
            >
              <Plus size={15} />
              {editing ? "Güncelle" : "Ekle"}
            </button>
            {msg && (
              <span
                className={`text-sm font-semibold ${
                  msg.startsWith("Hata") ? "text-red-600" : "text-green-600"
                }`}
              >
                {msg}
              </span>
            )}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">Yükleniyor...</p>
        ) : error ? (
          <p className="text-center text-sm text-red-500 py-10">{error}</p>
        ) : companies.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Henüz firma eklenmedi.
          </p>
        ) : (
          <div className="space-y-2">
            {companies.map((c) => (
              <div
                key={c.id}
                className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-4 ${
                  c.is_active ? "" : "opacity-50"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-bold text-sm">{c.name}</p>
                  {c.phone && (
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  )}
                  {c.tracking_url && (
                    <p className="text-xs text-gray-400 truncate">
                      {c.tracking_url}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(c)}
                    className="text-xs border px-3 py-1 rounded-md font-bold hover:bg-gray-50"
                  >
                    {c.is_active ? "Pasifleştir" : "Aktifleştir"}
                  </button>
                  <button
                    onClick={() => startEdit(c)}
                    className="p-1.5 border rounded-md hover:bg-gray-50"
                    aria-label="Düzenle"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => del(c)}
                    className="p-1.5 border border-red-200 text-red-500 rounded-md hover:bg-red-50"
                    aria-label="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
