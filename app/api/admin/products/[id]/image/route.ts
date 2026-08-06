import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { image } = await req.json();

  await pool.sql`UPDATE products SET image = ${image} WHERE id = ${params.id}`;

  return NextResponse.json({ success: true });
}
