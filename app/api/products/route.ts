import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SLUG_PLACEHOLDERS: Record<string, string> = {
  "zenith-sofa-set": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800",
  "bohem-sofa-set": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
  "lumiera-sofa-set": "https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800",
  "valens-sofa-set": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
  "zeus-corner-set": "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800",
  "noir-bed": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
  "orion-dining-table": "https://images.unsplash.com/photo-1617104678098-de229db51175?w=800",
  "atlas-tv-unit": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
};

const GENERIC_PLACEHOLDER =
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800";

const r2Configured = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

function resolveImage(slug: string, raw: string): string {
  const img = raw || "";

  if (img.startsWith("data:")) {
    if (img.length < 1200000) return img;
    return SLUG_PLACEHOLDERS[slug] || GENERIC_PLACEHOLDER;
  }

  // Unsplash CDN — always works
  if (img.includes("unsplash.com")) return img;

  // Cloudflare R2 public CDN
  if (img.includes("r2.dev")) {
    // Old upload bug: public URL was built as R2_PUBLIC_URL + "/" + "/key" → double slash
    // The key in R2 likely has a leading slash, so route through our proxy which tries both variants
    if (/r2\.dev\/\//.test(img)) {
      if (!r2Configured) return SLUG_PLACEHOLDERS[slug] || GENERIC_PLACEHOLDER;
      const afterDomain = img.replace(/^https?:\/\/[^/]+/, "").replace(/^\/+/, "/");
      return `/api/images?key=${encodeURIComponent(afterDomain)}`;
    }
    return img;
  }

  // Our proxy route — only works when R2 is configured server-side
  if (img.startsWith("/api/images?key=")) {
    if (r2Configured) return img;
    return SLUG_PLACEHOLDERS[slug] || GENERIC_PLACEHOLDER;
  }

  // Any other truthy URL (including broken/undefined-prefixed ones) → placeholder
  if (img) return SLUG_PLACEHOLDERS[slug] || GENERIC_PLACEHOLDER;

  // Empty → placeholder
  return SLUG_PLACEHOLDERS[slug] || GENERIC_PLACEHOLDER;
}

function needsHealing(img: string, resolved: string): boolean {
  if (img === resolved) return false;
  if (img.includes("unsplash.com")) return false;
  // r2.dev URLs with single slashes are valid; double-slash ones produce resolved !== img and will be healed
  // Admin-uploaded R2 proxy URLs when R2 is configured are intentional
  if (r2Configured && img.startsWith("/api/images?key=")) return false;
  return true;
}

export async function GET() {
  try {
    const { rows } = await pool.sql`
      SELECT p.id, p.slug, p.name_tr, p.name_en, p.price_min, p.price_max,
             p.image, p.description_tr, p.description_en,
             COALESCE(p.discount_percent, 0) as discount_percent,
             COALESCE(p.variants, '[]') as variants,
             c.name_tr as cat_tr, c.name_en as cat_en
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.sort_order ASC
    `;

    const toHeal: { id: string; image: string }[] = [];

    const products = rows.map((r) => {
      let variants: { name: string; hex: string; image: string }[] = [];
      try {
        variants = JSON.parse(r.variants || "[]");
      } catch {}

      const raw = r.image || "";
      const resolved = resolveImage(r.slug, raw);
      if (needsHealing(raw, resolved)) {
        toHeal.push({ id: String(r.id), image: resolved });
      }

      return {
        id: String(r.id),
        slug: r.slug,
        name: { tr: r.name_tr, en: r.name_en },
        category: { tr: r.cat_tr || "", en: r.cat_en || "" },
        priceMin: Number(r.price_min) || 0,
        priceMax: Number(r.price_max) || 0,
        image: resolved,
        description: { tr: r.description_tr, en: r.description_en },
        discountPercent: Number(r.discount_percent) || 0,
        variants,
      };
    });

    // Self-heal: persist resolved images so future fetches need no resolution
    if (toHeal.length > 0) {
      Promise.allSettled(
        toHeal.map(({ id, image }) =>
          pool.sql`UPDATE products SET image = ${image} WHERE id = ${id}`
        )
      ).catch(() => {});
    }

    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("[/api/products] DB error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { products: [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
