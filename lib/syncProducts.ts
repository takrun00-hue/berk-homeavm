import { pool } from "@/lib/db";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const DATA_DIR = path.join(process.cwd(), "public", "data");

async function buildProductsJson() {
  let rows: Record<string, unknown>[] = [];
  try {
    const r = await pool.sql`
      SELECT p.*, c.name_tr as cat_tr, c.name_en as cat_en
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY COALESCE(p.sort_order, 0) ASC, p.id ASC
    `;
    rows = r.rows;
  } catch {
    const r = await pool.sql`SELECT * FROM products ORDER BY COALESCE(sort_order,0) ASC, id ASC`;
    rows = r.rows.map((r) => ({ ...r, cat_tr: null, cat_en: null }));
  }

  const products = rows.map((r) => ({
    id: String(r.id),
    slug: r.slug,
    name: { tr: (r.name_tr as string) || "", en: (r.name_en as string) || "" },
    category: { tr: (r.cat_tr as string) || "", en: (r.cat_en as string) || (r.cat_tr as string) || "" },
    priceMin: Number(r.price_min) || 0,
    priceMax: Number(r.price_max) || 0,
    image: (r.image as string) || "",
    description: { tr: (r.description_tr as string) || "", en: (r.description_en as string) || "" },
    discountPercent: Number(r.discount_percent) || 0,
    variants: (() => { try { return JSON.parse((r.variants as string) || "[]"); } catch { return []; } })(),
  }));

  return JSON.stringify({ products });
}

async function buildCategoriesJson() {
  const r = await pool.sql`
    SELECT id, slug, name_tr, name_en, COALESCE(image,'') as image
    FROM categories ORDER BY COALESCE(sort_order,0) ASC, id ASC
  `;
  const categories = r.rows.map((r) => ({
    id: String(r.id),
    slug: r.slug,
    name: { tr: r.name_tr || "", en: r.name_en || "" },
    image: r.image || "",
  }));
  return JSON.stringify({ categories });
}

function gitPush() {
  // Only push when running locally in dev mode
  if (process.env.VERCEL) return;
  const cmd = [
    "git add public/data/products.json public/data/categories.json",
    'git diff --cached --quiet || git commit -m "sync: update products data"',
    "git push",
  ].join(" && ");

  exec(cmd, { cwd: process.cwd() }, (err) => {
    if (err) console.error("[syncProducts] git push error:", err.message);
    else console.log("[syncProducts] pushed to GitHub → Vercel will rebuild");
  });
}

export async function syncProducts() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    const [productsJson, categoriesJson] = await Promise.all([
      buildProductsJson(),
      buildCategoriesJson(),
    ]);

    fs.writeFileSync(path.join(DATA_DIR, "products.json"), productsJson);
    fs.writeFileSync(path.join(DATA_DIR, "categories.json"), categoriesJson);

    console.log("[syncProducts] static files updated");

    gitPush();
  } catch (err) {
    console.error("[syncProducts] error:", err);
  }
}
