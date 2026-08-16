"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Percent, Tag, Package, CheckCircle, AlertCircle } from "lucide-react";

interface CatTax {
  id: string;
  slug: string;
  name: { tr: string; en: string };
  taxRate: number | null;
}

interface ProdTax {
  id: string;
  slug: string;
  name_tr: string;
  catName: string;
  taxRate: number | null;
}

type SaveStatus = { id: string; ok: boolean } | null;

export default function TaxPage() {
  const [defaultRate, setDefaultRate] = useState<number>(20);
  const [categories, setCategories] = useState<CatTax[]>([]);
  const [products, setProducts] = useState<ProdTax[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SaveStatus>(null);
  const [tab, setTab] = useState<"categories" | "products">("categories");
  const [localRates, setLocalRates] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/migrate");
      const res = await fetch("/api/admin/tax");
      const d = await res.json();
      setDefaultRate(d.defaultRate ?? 20);
      setCategories(d.categories || []);
      setProducts(d.products || []);
      const rates: Record<string, string> = { default: String(d.defaultRate ?? 20) };
      (d.categories || []).forEach((c: CatTax) => { rates[`cat-${c.id}`] = c.taxRate !== null ? String(c.taxRate) : ""; });
      (d.products || []).forEach((p: ProdTax) => { rates[`prod-${p.id}`] = p.taxRate !== null ? String(p.taxRate) : ""; });
      setLocalRates(rates);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (type: string, id: string | null, taxRate: string | null) => {
    const key = id ? `${type}-${id}` : "default";
    setSaving({ id: key, ok: false });
    try {
      const body: Record<string, unknown> = { type };
      if (id) body.id = id;
      if (type === "default") body.defaultRate = taxRate;
      else body.taxRate = taxRate === "" ? null : taxRate;
      const res = await fetch("/api/admin/tax", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      setSaving({ id: key, ok: !!d.success });
      setTimeout(() => setSaving(null), 2000);
    } catch {
      setSaving({ id: key, ok: false });
      setTimeout(() => setSaving(null), 2000);
    }
  };

  const rateInput = (key: string, placeholder: string, type: string, id: string | null) => {
    const isSaving = saving?.id === (id ? `${type}-${id}` : "default");
    const saved = isSaving && saving?.ok;
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          placeholder={placeholder}
          value={localRates[key] ?? ""}
          onChange={(e) => setLocalRates((prev) => ({ ...prev, [key]: e.target.value }))}
          className="w-20 border rounded px-2 py-1 text-sm text-right"
        />
        <span className="text-gray-400 text-sm">%</span>
        <button
          onClick={() => save(type, id, localRates[key] ?? null)}
          disabled={isSaving}
          className="px-3 py-1 text-xs font-bold bg-black text-gold rounded disabled:opacity-40"
        >
          {isSaving ? "..." : "Kaydet"}
        </button>
        {saved && <CheckCircle size={14} className="text-green-500" />}
      </div>
    );
  };

  return (
    <AdminLayout titleKey="adminTax">
      <div className="max-w-3xl space-y-6">

        {/* Default tax rate */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Percent size={16} className="text-gold" />
            <h2 className="font-bold text-sm">Varsayılan KDV Oranı</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Kategori veya ürün için özel oran belirlenmemişse bu oran kullanılır.
          </p>
          <div className="flex items-center gap-3">
            {rateInput("default", "20", "default", null)}
            <span className="text-xs text-gray-400">
              Mevcut: <strong>%{defaultRate}</strong>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("categories")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${tab === "categories" ? "bg-black text-gold border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
          >
            <Tag size={14} /> Kategoriler
          </button>
          <button
            onClick={() => setTab("products")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${tab === "products" ? "bg-black text-gold border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
          >
            <Package size={14} /> Ürünler
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Yükleniyor...</p>
        ) : tab === "categories" ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <Tag size={14} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Kategoriye Göre KDV</span>
            </div>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Kategori bulunamadı.</p>
            ) : (
              <div className="divide-y">
                {categories.map((cat) => {
                  const key = `cat-${cat.id}`;
                  const effective = localRates[key] !== "" && localRates[key] !== undefined
                    ? localRates[key]
                    : null;
                  return (
                    <div key={cat.id} className="flex items-center justify-between px-4 py-3 gap-4">
                      <div>
                        <p className="font-semibold text-sm">{cat.name.tr}</p>
                        <p className="text-xs text-gray-400">
                          {effective ? `Özel: %${effective}` : `Varsayılan: %${defaultRate}`}
                        </p>
                      </div>
                      {rateInput(key, `${defaultRate}`, "category", cat.id)}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="px-4 py-2 bg-gray-50 border-t">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <AlertCircle size={11} /> Boş bırakırsanız varsayılan oran (%{defaultRate}) uygulanır.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <Package size={14} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Ürüne Göre KDV</span>
            </div>
            {products.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Ürün bulunamadı.</p>
            ) : (
              <div className="divide-y max-h-[60vh] overflow-y-auto">
                {products.map((prod) => {
                  const key = `prod-${prod.id}`;
                  const effective = localRates[key] !== "" && localRates[key] !== undefined
                    ? localRates[key]
                    : null;
                  return (
                    <div key={prod.id} className="flex items-center justify-between px-4 py-3 gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{prod.name_tr}</p>
                        <p className="text-xs text-gray-400">
                          {prod.catName} · {effective ? `Özel: %${effective}` : `Kategori/Varsayılan oranı`}
                        </p>
                      </div>
                      {rateInput(key, "—", "product", prod.id)}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="px-4 py-2 bg-gray-50 border-t">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <AlertCircle size={11} /> Boş bırakırsanız kategori oranı, o da yoksa varsayılan oran uygulanır.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
