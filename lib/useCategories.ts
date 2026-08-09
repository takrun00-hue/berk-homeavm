"use client";

import { useEffect, useState } from "react";
import { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      // Try live API first — only accept if it returns at least 1 category
      try {
        const res = await fetch(`/api/categories?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
            return;
          }
        }
      } catch {}

      // Fall back to static JSON baked at build time
      try {
        const res = await fetch(`/data/categories.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch {}
    };

    fetchCategories().finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
