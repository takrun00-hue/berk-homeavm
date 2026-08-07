import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.sql`
    SELECT products.* FROM favorites
    JOIN products ON favorites.product_id = products.id
    WHERE favorites.user_id = ${user.id}
    ORDER BY favorites.created_at DESC
  `;
  return NextResponse.json({ favorites: rows });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id } = await req.json();
  if (!product_id) return NextResponse.json({ error: "Missing product_id" }, { status: 400 });

  await pool.sql`
    INSERT INTO favorites (user_id, product_id) VALUES (${user.id}, ${product_id})
    ON CONFLICT (user_id, product_id) DO NOTHING
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id } = await req.json();
  if (!product_id) return NextResponse.json({ error: "Missing product_id" }, { status: 400 });

  await pool.sql`DELETE FROM favorites WHERE user_id = ${user.id} AND product_id = ${product_id}`;
  return NextResponse.json({ success: true });
}
