const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "../public/data");

function writeEmpty() {
  fs.writeFileSync(path.join(outDir, "products.json"), JSON.stringify({ products: [] }));
  fs.writeFileSync(path.join(outDir, "categories.json"), JSON.stringify({ categories: [] }));
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const dbUrl = process.env.DATABASE_URL;
  const host = process.env.SUPABASE_HOST;

  if (!dbUrl && !host) {
    console.warn("[generate-static-data] No DB env — writing empty files.");
    writeEmpty();
    return;
  }

  let pool;
  try {
    pool = host
      ? new Pool({
          host,
          port: Number(process.env.SUPABASE_PORT) || 6543,
          database: process.env.SUPABASE_DATABASE || "postgres",
          user: process.env.SUPABASE_USER,
          password: process.env.SUPABASE_PASSWORD,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 5000,
        })
      : new Pool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 5000,
        });

    const { rows: pRows } = await pool.query(`
      SELECT p.*, c.name_tr as cat_tr, c.name_en as cat_en
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY COALESCE(p.sort_order, 0) ASC, p.id ASC
    `);

    const products = pRows.map((r) => ({
      id: String(r.id),
      slug: r.slug,
      name: { tr: r.name_tr || "", en: r.name_en || "" },
      category: { tr: r.cat_tr || "", en: r.cat_en || r.cat_tr || "" },
      priceMin: Number(r.price_min) || 0,
      priceMax: Number(r.price_max) || 0,
      image: r.image || "",
      description: { tr: r.description_tr || "", en: r.description_en || "" },
      discountPercent: Number(r.discount_percent) || 0,
      variants: (() => { try { return JSON.parse(r.variants || "[]"); } catch { return []; } })(),
    }));

    fs.writeFileSync(path.join(outDir, "products.json"), JSON.stringify({ products }));
    console.log(`[generate-static-data] Wrote ${products.length} products.`);

    const { rows: cRows } = await pool.query(`
      SELECT id, slug, name_tr, name_en, COALESCE(image, '') as image
      FROM categories ORDER BY COALESCE(sort_order, 0) ASC, id ASC
    `);

    const categories = cRows.map((r) => ({
      id: String(r.id),
      slug: r.slug,
      name: { tr: r.name_tr || "", en: r.name_en || "" },
      image: r.image || "",
    }));

    fs.writeFileSync(path.join(outDir, "categories.json"), JSON.stringify({ categories }));
    console.log(`[generate-static-data] Wrote ${categories.length} categories.`);
  } catch (err) {
    console.error("[generate-static-data] Error (non-fatal):", err.message);
    writeEmpty();
  } finally {
    if (pool) {
      try { await pool.end(); } catch {}
    }
  }
}

main().catch((err) => {
  console.error("[generate-static-data] Fatal (non-fatal):", err.message);
  try { writeEmpty(); } catch {}
  // Always exit 0 so next build can proceed
  process.exit(0);
});
