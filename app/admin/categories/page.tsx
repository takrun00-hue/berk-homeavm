"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

interface Cat {
  id: number;
  slug: string;
  name_tr: string;
  name_en: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [slug, setSlug] = useState("");
  const [nameTr, setNameTr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name_tr: nameTr, name_en: nameEn }),
    });
    const data = await res.json();
    if (data.success) {
      setSlug("");
      setNameTr("");
      setNameEn("");
      load();
    } else {
      setError(data.message);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) load();
    else alert(data.message);
  };

  return (
    <section className="py-10 px-4 max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-extrabold">Kategoriler</h1>
      <AdminNav />

      <form onSubmit={handleAdd} className="space-y-2 border rounded-md p-3">
        <input
          placeholder="slug (örn: sofa-set)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        <input
          placeholder="Türkçe isim"
          value={nameTr}
          onChange={(e) => setNameTr(e.target.value)}
          required
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        <input
          placeholder="English name"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          required
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button className="w-full bg-black text-gold py-2 rounded-md text-sm font-bold">
          Ekle
        </button>
      </form>

      <div className="space-y-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex justify-between items-center border rounded-md p-3 text-sm"
          >
            <div>
              <p className="font-bold">{c.name_tr}</p>
              <p className="text-gray-400 text-xs">{c.slug}</p>
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-red-500 text-xs"
            >
              Sil
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
