"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/context/LanguageContext";
import { slugify } from "@/lib/slugify";

const STANDARD_SIZE = 800;

interface Cat {
  id: number;
  slug: string;
  name_tr: string;
  name_en: string;
  image: string;
}

const emptyForm = { slug: "", name_tr: "", name_en: "", image: "" };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { locale, t } = useLanguage();

  const load = () => {
    fetch(`/api/admin/categories?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.categories) setCategories(d.categories); })
      .catch(() => {});
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
        ctx.drawImage(
          img,
          sx,
          sy,
          side,
          side,
          0,
          0,
          STANDARD_SIZE,
          STANDARD_SIZE
        );
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
    // Show local preview immediately
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setError("");
    try {
      const resizedBlob = await resizeImage(file);
      const formData = new FormData();
      formData.append("file", resizedBlob, "category.jpg");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setForm((f) => ({ ...f, image: data.url }));
      } else {
        setError("Görsel yüklenemedi.");
      }
    } catch {
      setError("Görsel yüklenemedi.");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Keep the slug in step with the Turkish name while it is still the
      // generated one, so it only has to be touched to override it.
      if (name === "name_tr" && (!prev.slug || prev.slug === slugify(prev.name_tr))) {
        next.slug = slugify(value);
      }
      if (name === "slug") next.slug = slugify(value);
      return next;
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const url = editingId
      ? `/api/admin/categories/${editingId}/update`
      : "/api/admin/categories";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (data.success) {
      resetForm();
      if (!editingId && data.category) {
        // Add the new category immediately from the server response
        setCategories((prev) => [...prev, data.category]);
      }
      load();
    } else {
      setError(data.message || "Hata oluştu.");
    }
  };

  const handleEdit = (c: Cat) => {
    setEditingId(c.id);
    setForm({
      slug: c.slug,
      name_tr: c.name_tr,
      name_en: c.name_en,
      image: c.image || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("adminConfirmDelete"))) return;
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) load();
    else alert(data.message);
  };

  return (
    <AdminLayout titleKey="adminCategories">
      <div className="max-w-md space-y-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-2 border rounded-md p-3 bg-white"
        >
          <p className="font-bold text-sm">
            {editingId ? t("adminEdit") : t("adminAdd")}
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

          <div className="space-y-2">
            <label className="text-xs text-gray-500">
              {t("adminUpload")}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            {uploading && (
              <p className="text-xs text-gray-500">{t("adminUploading")}</p>
            )}
            {(previewUrl || form.image) && (
              <div className="space-y-1">
                {form.image && <p className="text-xs text-green-600">✓ Görsel yüklendi</p>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl || form.image}
                  alt="preview"
                  className="w-24 h-24 rounded-md object-cover border"
                />
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
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 border rounded-md p-3 text-sm bg-white"
            >
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.image}
                  alt={c.name_tr}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded object-cover border shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-gray-100 shrink-0 border flex items-center justify-center text-gray-300 text-xs">
                  ?
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold">
                  {locale === "tr" ? c.name_tr : c.name_en}
                </p>
                <p className="text-gray-400 text-xs">{c.slug}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleEdit(c)}
                  className="text-xs text-gold underline"
                >
                  {t("adminEdit")}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
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
