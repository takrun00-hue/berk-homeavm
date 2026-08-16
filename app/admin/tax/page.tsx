"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Percent, Tag, Package, CheckCircle, AlertCircle, Users } from "lucide-react";

interface CatTax {
  id: string;
  slug: string;
  name: { tr: string; en: string };
  taxTier: string;
}

interface ProdTax {
  id: string;
  slug: string;
  name_tr: string;
  catName: string;
  taxTier: string;
}

type SaveStatus = { id: string; ok: boolean } | null;

export default function TaxPage() {
  const [taxTiers, setTaxTiers] = useState({ standard: 20, reduced: 10, special: 1 });
  const [membership, setMembership] = useState({ memberDiscount: 0, loyaltyMinOrders: 5, loyaltyDiscount: 0 });
  const [categories, setCategories] = useState<CatTax[]>([]);
  const [products, setProducts] = useState<ProdTax[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SaveStatus>(null);
  const [tab, setTab] = useState<"tiers" | "membership" | "categories" | "products">("tiers");
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/migrate");
      const res = await fetch("/api/admin/tax");
      const d = await res.json();
      setTaxTiers(d.taxTiers);
      setMembership(d.membership);
      setCategories(d.categories || []);
      setProducts(d.products || []);
      const vals: Record<string, string> = {
        "tier-standard": String(d.taxTiers.standard),
        "tier-reduced": String(d.taxTiers.reduced),
        "tier-special": String(d.taxTiers.special),
        "member-discount": String(d.membership.memberDiscount),
        "loyalty-min-orders": String(d.membership.loyaltyMinOrders),
        "loyalty-discount": String(d.membership.loyaltyDiscount),
      };
      (d.categories || []).forEach((c: CatTax) => { vals[`cat-${c.id}`] = c.taxTier || "standard"; });
      (d.products || []).forEach((p: ProdTax) => { vals[`prod-${p.id}`] = p.taxTier || "standard"; });
      setLocalValues(vals);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (type: string, id: string | null, value: string) => {
    const key = id ? `${type}-${id}` : type;
    setSaving({ id: key, ok: false });
    try {
      const body: Record<string, unknown> = { type };
      if (id) body.id = id;
      body.taxTier = value === "" ? null : value;
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

  const tierInput = (key: string, label: string, type: string) => {
    const isSaving = saving?.id === key;
    const saved = isSaving && saving?.ok;
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex-1">
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-xs text-gray-500">Mevcut: %{localValues[key] || "0"}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={localValues[key] || ""}
            onChange={(e) => setLocalValues((prev) => ({ ...prev, [key]: e.target.value }))}
            className="w-20 border rounded px-2 py-1 text-sm text-right"
          />
          <span className="text-gray-400 text-sm">%</span>
          <button
            onClick={() => save(type, null, localValues[key] || "0")}
            disabled={isSaving}
            className="px-3 py-1 text-xs font-bold bg-black text-gold rounded disabled:opacity-40"
          >
            {isSaving ? "..." : "Kaydet"}
          </button>
          {saved && <CheckCircle size={14} className="text-green-500" />}
        </div>
      </div>
    );
  };

  const memberInput = (key: string, label: string, type: string, isPercent = true) => {
    const isSaving = saving?.id === key;
    const saved = isSaving && saving?.ok;
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex-1">
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-xs text-gray-500">Mevcut: {isPercent ? `%${localValues[key] || "0"}` : localValues[key] || "0"}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={isPercent ? 1 : 1}
            value={localValues[key] || ""}
            onChange={(e) => setLocalValues((prev) => ({ ...prev, [key]: e.target.value }))}
            className="w-20 border rounded px-2 py-1 text-sm text-right"
          />
          <span className="text-gray-400 text-sm">{isPercent ? "%" : ""}</span>
          <button
            onClick={() => save(type, null, localValues[key] || "0")}
            disabled={isSaving}
            className="px-3 py-1 text-xs font-bold bg-black text-gold rounded disabled:opacity-40"
          >
            {isSaving ? "..." : "Kaydet"}
          </button>
          {saved && <CheckCircle size={14} className="text-green-500" />}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout titleKey="adminTax">
      <div className="max-w-3xl space-y-6">

        {/* Navigation Tabs */}
        <div className="flex gap-2 flex-wrap">
          {["tiers", "membership", "categories", "products"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                tab === t ? "bg-black text-gold border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {t === "tiers" && <Percent size={14} />}
              {t === "membership" && <Users size={14} />}
              {t === "categories" && <Tag size={14} />}
              {t === "products" && <Package size={14} />}
              {t === "tiers" && "KDV Seviyeleri"}
              {t === "membership" && "Üyelik & Sadakat"}
              {t === "categories" && "Kategoriler"}
              {t === "products" && "Ürünler"}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Yükleniyor...</p>
        ) : tab === "tiers" ? (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Percent size={16} className="text-gold" />
                <h2 className="font-bold text-sm">KDV Seviyeleri (Vergiler)</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Kategori veya ürüne atanacak KDV oranlarını tanımlayın. Standart, İndirimli ve Özel oranları konfigüre edin.
              </p>
              {tierInput("tier-standard", "Standart Oran", "tier-standard")}
              {tierInput("tier-reduced", "İndirimli Oran", "tier-reduced")}
              {tierInput("tier-special", "Özel Oran", "tier-special")}
            </div>
          </div>
        ) : tab === "membership" ? (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-gold" />
                <h2 className="font-bold text-sm">Üyelik & Sadakat Programı</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Kayıtlı üyeler ve sadık müşteriler için indirimler tanımlayın.
              </p>
              <div className="space-y-3">
                <div className="border-b pb-4">
                  <p className="font-semibold text-sm mb-3 text-gray-700">Üyelik İndirimi</p>
                  {memberInput("member-discount", "Kayıtlı üyelere verilen indirim", "member-discount", true)}
                </div>
                <div className="border-b pb-4">
                  <p className="font-semibold text-sm mb-3 text-gray-700">Sadakat Programı</p>
                  {memberInput("loyalty-min-orders", "Sadakat aktivasyonu için minimum sipariş sayısı", "loyalty-min-orders", false)}
                  {memberInput("loyalty-discount", "Sadakat müşterilerine verilen indirim", "loyalty-discount", true)}
                </div>
              </div>
            </div>
          </div>
        ) : tab === "categories" ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <Tag size={14} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Kategoriye Göre KDV Seviyesi</span>
            </div>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Kategori bulunamadı.</p>
            ) : (
              <div className="divide-y">
                {categories.map((cat) => {
                  const key = `cat-${cat.id}`;
                  const tier = localValues[key] || "standard";
                  const tierRate = tier === "standard" ? taxTiers.standard : tier === "reduced" ? taxTiers.reduced : taxTiers.special;
                  return (
                    <div key={cat.id} className="flex items-center justify-between px-4 py-3 gap-4">
                      <div>
                        <p className="font-semibold text-sm">{cat.name.tr}</p>
                        <p className="text-xs text-gray-400">
                          {tier}: %{tierRate}
                        </p>
                      </div>
                      <select
                        value={tier}
                        onChange={(e) => setLocalValues((prev) => ({ ...prev, [key]: e.target.value }))}
                        onBlur={() => save("category", cat.id, tier)}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="standard">Standart ({taxTiers.standard}%)</option>
                        <option value="reduced">İndirimli ({taxTiers.reduced}%)</option>
                        <option value="special">Özel ({taxTiers.special}%)</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <Package size={14} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Ürüne Göre KDV Seviyesi</span>
            </div>
            {products.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Ürün bulunamadı.</p>
            ) : (
              <div className="divide-y max-h-[60vh] overflow-y-auto">
                {products.map((prod) => {
                  const key = `prod-${prod.id}`;
                  const tier = localValues[key] || "standard";
                  const tierRate = tier === "standard" ? taxTiers.standard : tier === "reduced" ? taxTiers.reduced : taxTiers.special;
                  return (
                    <div key={prod.id} className="flex items-center justify-between px-4 py-3 gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{prod.name_tr}</p>
                        <p className="text-xs text-gray-400">
                          {prod.catName} · {tier}: %{tierRate}
                        </p>
                      </div>
                      <select
                        value={tier}
                        onChange={(e) => setLocalValues((prev) => ({ ...prev, [key]: e.target.value }))}
                        onBlur={() => save("product", prod.id, tier)}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="standard">Standart ({taxTiers.standard}%)</option>
                        <option value="reduced">İndirimli ({taxTiers.reduced}%)</option>
                        <option value="special">Özel ({taxTiers.special}%)</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
