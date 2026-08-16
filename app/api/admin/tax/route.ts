import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [{ rows: cats }, { rows: prods }, { rows: sets }] = await Promise.all([
      pool.sql`SELECT id, slug, name_tr, name_en, COALESCE(tax_tier, '') as tax_tier FROM categories ORDER BY id ASC`,
      pool.sql`SELECT p.id, p.slug, p.name_tr, COALESCE(p.tax_tier, '') as tax_tier, c.name_tr as cat_tr FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.sort_order ASC`,
      pool.sql`SELECT key, value FROM site_settings WHERE key IN ('tax_tier_standard', 'tax_tier_reduced', 'tax_tier_special', 'member_discount', 'loyalty_min_orders', 'loyalty_discount')`,
    ]);

    const settings: Record<string, string> = {};
    sets.forEach((r) => (settings[r.key] = r.value));

    const taxTiers = {
      standard: Number(settings.tax_tier_standard) || 20,
      reduced: Number(settings.tax_tier_reduced) || 10,
      special: Number(settings.tax_tier_special) || 1,
    };

    const membership = {
      memberDiscount: Number(settings.member_discount) || 0,
      loyaltyMinOrders: Number(settings.loyalty_min_orders) || 5,
      loyaltyDiscount: Number(settings.loyalty_discount) || 0,
    };

    return NextResponse.json({
      taxTiers,
      membership,
      categories: cats.map((r) => ({
        id: String(r.id),
        slug: r.slug,
        name: { tr: r.name_tr, en: r.name_en },
        taxTier: r.tax_tier || "standard",
      })),
      products: prods.map((r) => ({
        id: String(r.id),
        slug: r.slug,
        name_tr: r.name_tr,
        catName: r.cat_tr || "—",
        taxTier: r.tax_tier || "standard",
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
    const body = await req.json();
    const { type, id, taxTier } = body;

    if (type === "tier-standard" || type === "tier-reduced" || type === "tier-special") {
      const rate = Number(taxTier);
      if (isNaN(rate) || rate < 0 || rate > 100) return NextResponse.json({ error: "Geçersiz oran." }, { status: 400 });
      const key = `tax_${type}`;
      await pool.sql`
        INSERT INTO site_settings (key, value) VALUES (${key}, ${String(rate)})
        ON CONFLICT (key) DO UPDATE SET value = ${String(rate)}
      `;
      return NextResponse.json({ success: true });
    }

    if (type === "member-discount" || type === "loyalty-discount" || type === "loyalty-min-orders") {
      const val = Number(taxTier);
      if (isNaN(val) || val < 0) return NextResponse.json({ error: "Geçersiz değer." }, { status: 400 });
      const key = `${type === "member-discount" ? "member_discount" : type === "loyalty-min-orders" ? "loyalty_min_orders" : "loyalty_discount"}`;
      await pool.sql`
        INSERT INTO site_settings (key, value) VALUES (${key}, ${String(val)})
        ON CONFLICT (key) DO UPDATE SET value = ${String(val)}
      `;
      return NextResponse.json({ success: true });
    }

    if (type === "category" && id) {
      if (!taxTier || taxTier === "standard") {
        await pool.sql`UPDATE categories SET tax_tier = '' WHERE id = ${Number(id)}`;
      } else {
        await pool.sql`UPDATE categories SET tax_tier = ${taxTier} WHERE id = ${Number(id)}`;
      }
      return NextResponse.json({ success: true });
    }

    if (type === "product" && id) {
      if (!taxTier || taxTier === "standard") {
        await pool.sql`UPDATE products SET tax_tier = '' WHERE id = ${Number(id)}`;
      } else {
        await pool.sql`UPDATE products SET tax_tier = ${taxTier} WHERE id = ${Number(id)}`;
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  } catch (e) {
    console.error("[/api/admin/tax] PATCH error:", e);
    return NextResponse.json({ error: "DB hatası" }, { status: 500 });
  }
}
