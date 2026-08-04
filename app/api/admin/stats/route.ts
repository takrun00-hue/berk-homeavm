import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await pool.sql`SELECT COUNT(*) FROM products`;
  const categories = await pool.sql`SELECT COUNT(*) FROM categories`;
  const users = await pool.sql`SELECT COUNT(*) FROM users`;

  return NextResponse.json({
    productCount: Number(products.rows[0].count),
    categoryCount: Number(categories.rows[0].count),
    userCount: Number(users.rows[0].count),
  });
}
