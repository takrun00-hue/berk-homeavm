"use client";

import { useEffect, useState } from "react";
import { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `/api/categories?t=${Date.now()}`;
    fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
