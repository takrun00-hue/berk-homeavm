"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Plus, Trash2, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/context/LanguageContext";
import {
  DEFAULT_TAX_RATES,
  TAX_TIER_LABELS,
  effectiveTaxRate,
  splitInclusiveTax,
} from "@/lib/tax";

const STANDARD_SIZE = 600;

interface Cat {
  id: number;
  name_tr: string;
  name_en: string;
}

interface ColorVariant {
  name: string;
  hex: string;
  image: string;
}

interface Prod {
  id: number;
  slug: string;
  name_tr: string;
  name_en: string;
  category_id: number | null;
  cat_tr: string | null;
  price_min: number;
  price_max: number;
  image: string;
  description_tr: string;
  description_en: string;
  sort_order: number;
  discount_percent: number;
  variants: ColorVariant[];
  /** Empty means "inherit the category's tier". */
  tax_tier: string | null;
  /** null means stock is not tracked. */
  stock: number | null;
}

const emptyForm = {
  slug: "",
  name_tr: "",
  name_en: "",
  category_id: "",
  price: "",
  image: "",
  description_tr: "",
  description_en: "",
  discount_percent: "0",
  tax_tier: "",
  stock: "",
};

const emptyVariant: ColorVariant = { name: "", hex: "#000000", image: "" };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Prod[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [variants, setVariants] = useState<ColorVariant[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [variantUploading, setVariantUploading] = useState<number | null>(null);
  const [taxRates, setTaxRates] = useState(DEFAULT_TAX_RATES);
  const [categoryTiers, setCategoryTiers] = useState<Record<string, string>>({});
  const { locale, t } = useLanguage();

  // Rate a product inherits when its own tier is left on "Kategoriden".
  const categoryTaxRate = effectiveTaxRate(null, categoryTiers[form.category_id], taxRates);
  const effectiveFormTaxRate = effectiveTaxRate(
    form.tax_tier,
    categoryTiers[form.category_id],
    taxRates
  );

  const load = () => {
    fetch("/api/admin/products")
      .then((r) => {
        if (!r.ok) throw new Error(`Ürünler yüklenemedi (HTTP ${r.status})`);
        return r.json();
      })
      .then((d) => setProducts(d.products || []))
      .catch((e: Error) => setError(e.message));
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
    // Tier percentages and each category's tier, so the form can show the real
    // rate a product will be taxed at.
    fetch("/api/admin/tax")
      .then((r) => r.json())
      .then((d) => {
        if (d.taxTiers) setTaxRates(d.taxTiers);
        const tiers: Record<string, string> = {};
        (d.categories || []).forEach((c: { id: string; taxTier: string }) => {
          tiers[c.id] = c.taxTier;
        });
        setCategoryTiers(tiers);
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Ensure the stock column (and other migrations) exist before the form
    // saves a product that references it, then load.
    fetch("/api/admin/migrate").catch(() => {}).finally(load);
  }, []);

  const resizeToBlob = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Dosya okunamadı"));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Görsel yüklenemedi"));
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = STANDARD_SIZE;
          canvas.height = STANDARD_SIZE;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas hatası"));
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;
          ctx.drawImage(img, sx, sy, side, side, 0, 0, STANDARD_SIZE, STANDARD_SIZE);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Blob hatası"))),
            "image/jpeg",
            0.82
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Dosya okunamadı"));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Görsel yüklenemedi"));
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = STANDARD_SIZE;
          canvas.height = STANDARD_SIZE;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas hatası"));
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;
          ctx.drawImage(img, sx, sy, side, side, 0, 0, STANDARD_SIZE, STANDARD_SIZE);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (file: File): Promise<{ url: string; storage: string }> => {
    const blob = await resizeToBlob(file);
    const formData = new FormData();
    formData.append("file", blob, "product.jpg");
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Sunucu hatası: ${res.status}`);
    const data = await res.json();
    if (!data.url) throw new Error("URL döndürülmedi");
    return data;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const data = await uploadFile(file);
      setForm((f) => ({ ...f, image: data.url }));
      setUploadMsg({
        ok: true,
        text: data.storage === "r2" ? "✓ R2'ye kaydedildi" : "✓ Görsel kaydedildi",
      });
    } catch {
      // Fallback: client-side base64 if server upload fails
      try {
        const dataUrl = await fileToDataUrl(file);
        setForm((f) => ({ ...f, image: dataUrl }));
        setUploadMsg({ ok: true, text: "✓ Görsel hazır (yerel)" });
      } catch (err2) {
        setUploadMsg({ ok: false, text: "✗ Hata: " + (err2 instanceof Error ? err2.message : String(err2)) });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setVariants([]);
    setEditingId(null);
    setUploadMsg(null);
  };

  const addVariant = () => setVariants((v) => [...v, { ...emptyVariant }]);

  const updateVariant = (i: number, field: keyof ColorVariant, value: string) => {
    setVariants((v) => v.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const removeVariant = (i: number) => setVariants((v) => v.filter((_, idx) => idx !== i));

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVariantUploading(i);
    try {
      const data = await uploadFile(file);
      updateVariant(i, "image", data.url);
    } catch {
      try {
        const dataUrl = await fileToDataUrl(file);
        updateVariant(i, "image", dataUrl);
      } catch (err2) {
        setError("Varyant görseli hatası: " + (err2 instanceof Error ? err2.message : String(err2)));
      }
    } finally {
      setVariantUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const body = {
      slug: form.slug,
      name_tr: form.name_tr,
      name_en: form.name_en,
      category_id: form.category_id ? Number(form.category_id) : null,
      price_min: Number(form.price),
      price_max: Number(form.price),
      image: form.image,
      description_tr: form.description_tr,
      description_en: form.description_en,
      discount_percent: Number(form.discount_percent) || 0,
      variants: variants.filter((v) => v.name && v.image),
      tax_tier: form.tax_tier || null,
      // Empty field means untracked (null); a number is the tracked count.
      stock: form.stock === "" ? null : Number(form.stock),
    };

    const url = editingId
      ? `/api/admin/products/${editingId}`
      : "/api/admin/products";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.success) {
      resetForm();
      load();
    } else {
      setError(data.message || "Error.");
    }
  };

  const handleEdit = (p: Prod) => {
    setEditingId(p.id);
    setForm({
      slug: p.slug,
      name_tr: p.name_tr,
      name_en: p.name_en,
      category_id: p.category_id ? String(p.category_id) : "",
      price: String(p.price_min),
      image: p.image,
      description_tr: p.description_tr || "",
      description_en: p.description_en || "",
      discount_percent: String(p.discount_percent || 0),
      tax_tier: p.tax_tier || "",
      stock: p.stock === null || p.stock === undefined ? "" : String(p.stock),
    });
    setVariants(Array.isArray(p.variants) ? p.variants : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("adminConfirmDelete"))) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  };

  const handleMove = async (id: number, direction: "up" | "down") => {
    await fetch("/api/admin/products/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, direction }),
    });
    load();
  };

  return (
    <AdminLayout titleKey="adminProducts">
      <div className="max-w-md space-y-6">
        <form onSubmit={handleSubmit} className="space-y-2 border rounded-md p-3 bg-white">
          <p className="font-bold text-sm">
            {editingId ? t("adminEditProduct") : t("adminNewProduct")}
          </p>

          <input
            name="slug"
            placeholder={t("adminSlugPlaceholder")}
            value={form.slug}
            onChange={handleChange}
            required
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <input
            name="name_tr"
            placeholder={t("adminNameTrPlaceholder")}
            value={form.name_tr}
            onChange={handleChange}
            required
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <input
            name="name_en"
            placeholder={t("adminNameEnPlaceholder")}
            value={form.name_en}
            onChange={handleChange}
            required
            className="w-full border rounded-md px-3 py-2 text-sm"
          />

          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">{t("adminSelectCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === "tr" ? c.name_tr : c.name_en}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              name="price"
              type="number"
              placeholder="Fiyat (₺)"
              value={form.price}
              onChange={handleChange}
              required
              className="flex-1 border rounded-md px-3 py-2 text-sm"
            />
            <select
              name="tax_tier"
              value={form.tax_tier}
              onChange={handleChange}
              title="KDV oranı"
              className="w-40 border rounded-md px-2 py-2 text-sm bg-white"
            >
              <option value="">
                Kategoriden ({categoryTaxRate}%)
              </option>
              {(["standard", "reduced", "special"] as const).map((tier) => (
                <option key={tier} value={tier}>
                  {TAX_TIER_LABELS[tier].tr} %{taxRates[tier]}
                </option>
              ))}
            </select>
          </div>
          {/* Prices are entered tax-inclusive, so show the split the customer
              will be shown at checkout rather than leaving it implicit. */}
          {Number(form.price) > 0 && (
            <p className="text-xs text-gray-500 -mt-1">
              {Number(form.price).toLocaleString("tr-TR")} ₺ KDV dahil ={" "}
              <span className="font-semibold">
                {Math.round(splitInclusiveTax(Number(form.price), effectiveFormTaxRate).net).toLocaleString("tr-TR")} ₺
              </span>{" "}
              + %{effectiveFormTaxRate} KDV{" "}
              <span className="font-semibold">
                {Math.round(splitInclusiveTax(Number(form.price), effectiveFormTaxRate).tax).toLocaleString("tr-TR")} ₺
              </span>
            </p>
          )}

          <textarea
            name="description_tr"
            placeholder={t("adminDescTr")}
            value={form.description_tr}
            onChange={handleChange}
            rows={2}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <textarea
            name="description_en"
            placeholder={t("adminDescEn")}
            value={form.description_en}
            onChange={handleChange}
            rows={2}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap">İndirim (%):</label>
            <input
              name="discount_percent"
              type="number"
              min={0}
              max={100}
              placeholder="0"
              value={form.discount_percent}
              onChange={handleChange}
              className="w-24 border rounded-md px-3 py-2 text-sm"
            />
            {Number(form.discount_percent) > 0 && (
              <span className="text-xs text-green-600 font-bold">%{form.discount_percent} indirim</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap">Stok Adedi:</label>
            <input
              name="stock"
              type="number"
              min={0}
              placeholder="Sınırsız"
              value={form.stock}
              onChange={handleChange}
              className="w-28 border rounded-md px-3 py-2 text-sm"
            />
            <span className="text-xs text-gray-400">
              {form.stock === "" ? "boş = takip edilmez" : `müşteri "${form.stock} adet" görür`}
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            {uploading && <p className="text-xs text-blue-600">⏳ İşleniyor...</p>}
            {uploadMsg && (
              <p className={`text-xs font-bold ${uploadMsg.ok ? "text-green-600" : "text-red-600"}`}>
                {uploadMsg.text}
              </p>
            )}
            {form.image && !uploading && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image}
                alt="preview"
                className="w-32 h-32 rounded-md object-cover border"
              />
            )}
          </div>

          <div className="border rounded-md p-3 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Renk Seçenekleri</p>
              <button type="button" onClick={addVariant} className="flex items-center gap-1 text-xs text-gold font-bold">
                <Plus size={12} /> Renk Ekle
              </button>
            </div>
            {variants.map((v, i) => (
              <div key={i} className="border rounded-md p-2 bg-white space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    placeholder="Renk adı (örn: Beyaz)"
                    value={v.name}
                    onChange={(e) => updateVariant(i, "name", e.target.value)}
                    className="flex-1 border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="color"
                    value={v.hex}
                    onChange={(e) => updateVariant(i, "hex", e.target.value)}
                    className="w-9 h-9 rounded border cursor-pointer"
                    title="Renk seç"
                  />
                  <button type="button" onClick={() => removeVariant(i)} className="text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleVariantImageUpload(e, i)}
                    className="flex-1 border rounded px-2 py-1 text-xs"
                  />
                  {variantUploading === i && <span className="text-xs text-gray-400">Yükleniyor...</span>}
                  {v.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.image} alt={v.name} className="w-10 h-10 rounded object-cover border shrink-0" />
                  )}
                </div>
              </div>
            ))}
            {variants.length === 0 && (
              <p className="text-xs text-gray-400">Renk seçeneği yok. "Renk Ekle" ile ekleyebilirsiniz.</p>
            )}
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button className="flex-1 bg-black text-gold py-2 rounded-md text-sm font-bold">
              {editingId ? t("adminUpdate") : t("adminAdd")}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 border rounded-md text-sm"
              >
                {t("adminCancel")}
              </button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          {products.length === 0 && !error && (
            <p className="text-xs text-gray-400 text-center py-4">Ürün bulunamadı.</p>
          )}
          {products.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center gap-3 border rounded-md p-3 text-sm bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.name_tr} className="w-14 h-14 rounded object-cover shrink-0 border" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold">{locale === "tr" ? p.name_tr : p.name_en}</p>
                  {!p.category_id && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">
                      <AlertCircle size={11} /> Kategori yok
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs">{p.cat_tr || "Atanmamış"}</p>
              </div>
              <div className="flex flex-col">
                <button
                  disabled={idx === 0}
                  onClick={() => handleMove(p.id, "up")}
                  className="disabled:opacity-20"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  disabled={idx === products.length - 1}
                  onClick={() => handleMove(p.id, "down")}
                  className="disabled:opacity-20"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleEdit(p)}
                  className="text-xs text-gold underline"
                >
                  {t("adminEdit")}
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs text-red-500 underline"
                >
                  {t("adminDelete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
