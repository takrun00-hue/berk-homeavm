"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/context/LanguageContext";

const STANDARD_SIZE = 1000;

interface Cat {
  id: number;
  name_tr: string;
  name_en: string;
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
}

const emptyForm = {
  slug: "",
  name_tr: "",
  name_en: "",
  category_id: "",
  price_min: "",
  price_max: "",
  image: "",
  description_tr: "",
  description_en: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Prod[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const { locale, t } = useLanguage();

  const load = () => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  };

  useEffect(() => {
    load();
  }, []);

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = STANDARD_SIZE;
        canvas.height = STANDARD_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas error");
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, STANDARD_SIZE, STANDARD_SIZE);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject("Blob error")),
          "image/jpeg",
          0.9
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const resizedBlob = await resizeImage(file);
      const formData = new FormData();
      formData.append("file", resizedBlob, "product.jpg");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setForm((f) => ({ ...f, image: data.url }));
      }
    } catch (err) {
      setError("Upload failed.");
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
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const body = {
      slug: form.slug,
      name_tr: form.name_tr,
      name_en: form.name_en,
      category_id: form.category_id ? Number(form.category_id) : null,
      price_min: Number(form.price_min),
      price_max: Number(form.price_max),
      image: form.image,
      description_tr: form.description_tr,
      description_en: form.description_en,
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
      price_min: String(p.price_min),
      price_max: String(p.price_max),
      image: p.image,
      description_tr: p.description_tr || "",
      description_en: p.description_en || "",
    });
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
              name="price_min"
              type="number"
              placeholder={t("adminMinPrice")}
              value={form.price_min}
              onChange={handleChange}
              required
              className="w-1/2 border rounded-md px-3 py-2 text-sm"
            />
            <input
              name="price_max"
              type="number"
              placeholder={t("adminMaxPrice")}
              value={form.price_max}
              onChange={handleChange}
              required
              className="w-1/2 border rounded-md px-3 py-2 text-sm"
            />
          </div>

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

          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            {uploading && <p className="text-xs text-gray-500">{t("adminUploading")}</p>}
            {form.image && (
              <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                <Image src={form.image} alt="preview" fill className="object-cover" />
              </div>
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
          {products.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center gap-3 border rounded-md p-3 text-sm bg-white"
            >
              <div className="relative w-14 h-14 rounded overflow-hidden shrink-0">
                <Image src={p.image} alt={p.name_tr} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-bold">{locale === "tr" ? p.name_tr : p.name_en}</p>
                <p className="text-gray-400 text-xs">{p.cat_tr || "-"}</p>
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
