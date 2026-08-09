"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      // Try live API first — only accept if it returns at least 1 product
      // (an empty response likely means a DB error, not a truly empty catalog)
      try {
        const res = await fetch(`/api/products?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
            return;
          }
        }
      } catch {}

      // Fall back to static JSON baked at build time
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
