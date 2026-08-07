import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.sql`
    SELECT id, name, email, COALESCE(discount_percent, 0) as discount_percent, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ users: rows });
}
