import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [{ rows: cats }, { rows: prods }, { rows: settings }] = await Promise.all([
      pool.sql`SELECT id, slug, name_tr, name_en, COALESCE(tax_rate, -1) as tax_rate FROM categories ORDER BY id ASC`,
      pool.sql`SELECT p.id, p.slug, p.name_tr, COALESCE(p.tax_rate, -1) as tax_rate, c.name_tr as cat_tr FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.sort_order ASC`,
      pool.sql`SELECT value FROM site_settings WHERE key = 'default_tax_rate'`,
    ]);

    const defaultRate = settings[0] ? Number(settings[0].value) : 20;

    return NextResponse.json({
      defaultRate,
      categories: cats.map((r) => ({
        id: String(r.id),
        slug: r.slug,
        name: { tr: r.name_tr, en: r.name_en },
        taxRate: r.tax_rate === -1 ? null : Number(r.tax_rate),
      })),
      products: prods.map((r) => ({
        id: String(r.id),
        slug: r.slug,
        name_tr: r.name_tr,
        catName: r.cat_tr || "—",
        taxRate: r.tax_rate === -1 ? null : Number(r.tax_rate),
      })),
    });
  } catch (e) {
    console.error("[/api/admin/tax] GET error:", e);
    return NextResponse.json({ error: "DB hatası" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { type, id, taxRate, defaultRate } = await req.json();

    if (type === "default") {
      const rate = Number(defaultRate);
      if (isNaN(rate) || rate < 0 || rate > 100) return NextResponse.json({ error: "Geçersiz oran." }, { status: 400 });
      await pool.sql`
        INSERT INTO site_settings (key, value) VALUES ('default_tax_rate', ${String(rate)})
        ON CONFLICT (key) DO UPDATE SET value = ${String(rate)}
      `;
      return NextResponse.json({ success: true });
    }

    if (type === "category" && id) {
      if (taxRate === null || taxRate === "") {
        await pool.sql`UPDATE categories SET tax_rate = NULL WHERE id = ${Number(id)}`;
      } else {
        const rate = Number(taxRate);
        if (isNaN(rate) || rate < 0 || rate > 100) return NextResponse.json({ error: "Geçersiz oran." }, { status: 400 });
        await pool.sql`UPDATE categories SET tax_rate = ${rate} WHERE id = ${Number(id)}`;
      }
      return NextResponse.json({ success: true });
    }

    if (type === "product" && id) {
      if (taxRate === null || taxRate === "") {
        await pool.sql`UPDATE products SET tax_rate = NULL WHERE id = ${Number(id)}`;
      } else {
        const rate = Number(taxRate);
        if (isNaN(rate) || rate < 0 || rate > 100) return NextResponse.json({ error: "Geçersiz oran." }, { status: 400 });
        await pool.sql`UPDATE products SET tax_rate = ${rate} WHERE id = ${Number(id)}`;
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  } catch (e) {
    console.error("[/api/admin/tax] PATCH error:", e);
    return NextResponse.json({ error: "DB hatası" }, { status: 500 });
  }
}
