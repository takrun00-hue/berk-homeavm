import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function POST(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, direction } = await req.json();

  const current = await pool.sql`SELECT id, sort_order FROM products WHERE id = ${id}`;
  if (current.rows.length === 0) {
    return NextResponse.json({ success: false }, { status: 404 });
  }
  const currentOrder = current.rows[0].sort_order;

  const neighbor =
    direction === "up"
      ? await pool.sql`SELECT id, sort_order FROM products WHERE sort_order < ${currentOrder} ORDER BY sort_order DESC LIMIT 1`
      : await pool.sql`SELECT id, sort_order FROM products WHERE sort_order > ${currentOrder} ORDER BY sort_order ASC LIMIT 1`;

  if (neighbor.rows.length === 0) {
    return NextResponse.json({ success: true }); // already at edge
  }

  const neighborId = neighbor.rows[0].id;
  const neighborOrder = neighbor.rows[0].sort_order;

  await pool.sql`UPDATE products SET sort_order = ${neighborOrder} WHERE id = ${id}`;
  await pool.sql`UPDATE products SET sort_order = ${currentOrder} WHERE id = ${neighborId}`;

  return NextResponse.json({ success: true });
}
