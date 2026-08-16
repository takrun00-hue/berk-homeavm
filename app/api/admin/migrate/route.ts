import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT ''`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT DEFAULT ''`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT ''`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal INTEGER DEFAULT 0`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate INTEGER DEFAULT 20`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost INTEGER DEFAULT 0`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cargo_company TEXT DEFAULT ''`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT DEFAULT ''`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending'`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT ''`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT ''`;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_snapshot TEXT DEFAULT '[]'`;

    // Tax rate columns (store tier name, not percentage)
    await pool.sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS tax_tier TEXT DEFAULT NULL`;
    await pool.sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_tier TEXT DEFAULT NULL`;

    // Change log for tracking admin updates (prevent overwrites, notify bots)
    await pool.sql`
      CREATE TABLE IF NOT EXISTS change_log (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        action VARCHAR(20) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_by VARCHAR(100) DEFAULT 'admin',
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT FALSE
      )
    `;
    await pool.sql`CREATE INDEX IF NOT EXISTS idx_change_log_synced ON change_log(synced)`;
    await pool.sql`CREATE INDEX IF NOT EXISTS idx_change_log_entity ON change_log(entity_type, entity_id)`;

    // Initialize tax tiers in site_settings if not present
    await pool.sql`
      INSERT INTO site_settings (key, value) VALUES
        ('tax_tier_standard', '20'),
        ('tax_tier_reduced', '10'),
        ('tax_tier_special', '1'),
        ('member_discount', '0'),
        ('loyalty_min_orders', '5'),
        ('loyalty_discount', '0')
      ON CONFLICT (key) DO NOTHING
    `;

    // Cargo companies the admin can manage, replacing the previously hardcoded
    // list. Seeded with the original names so existing orders keep matching.
    await pool.sql`
      CREATE TABLE IF NOT EXISTS cargo_companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        tracking_url TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        is_active BOOLEAN DEFAULT true
      )
    `;
    await pool.sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cargo_company_id INTEGER REFERENCES cargo_companies(id)`;
    await pool.sql`
      INSERT INTO cargo_companies (name) VALUES
        ('PTT Kargo'), ('Yurtiçi Kargo'), ('Aras Kargo'), ('MNG Kargo'),
        ('Sürat Kargo'), ('UPS'), ('DHL'), ('Diğer')
      ON CONFLICT (name) DO NOTHING
    `;

    return NextResponse.json({ success: true, message: "Migration tamamlandı." });
  } catch (e) {
    console.error("Migration error:", e);
    return NextResponse.json({ error: "Migration başarısız." }, { status: 500 });
  }
}
