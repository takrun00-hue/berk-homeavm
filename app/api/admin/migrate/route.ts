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

    // Tax rate columns
    await pool.sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS tax_rate INTEGER DEFAULT NULL`;
    await pool.sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate INTEGER DEFAULT NULL`;

    return NextResponse.json({ success: true, message: "Migration tamamlandı." });
  } catch (e) {
    console.error("Migration error:", e);
    return NextResponse.json({ error: "Migration başarısız." }, { status: 500 });
  }
}
