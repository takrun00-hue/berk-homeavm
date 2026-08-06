"use client";

import { useEffect, useState } from "react";
import { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
