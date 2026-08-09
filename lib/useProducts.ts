"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      // Try live API first so new products appear immediately
      try {
        const res = await fetch(`/api/products?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products)) {
            setProducts(data.products);
            return;
          }
        }
      } catch {}

      // Fallback to static JSON (works when API routes are unavailable)
      try {
        const res = await fetch(`/data/products.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {}
    };

    fetchProducts().finally(() => setLoading(false));
  }, []);

  return { products, loading };
}
