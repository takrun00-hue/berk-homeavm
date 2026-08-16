import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { entityType, entityId, action, oldValue, newValue, changedBy } = await req.json();

    if (!entityType || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await pool.sql`
      INSERT INTO change_log (entity_type, entity_id, action, old_value, new_value, changed_by)
      VALUES (${entityType}, ${entityId || null}, ${action}, ${oldValue || null}, ${newValue || null}, ${changedBy || "admin"})
    `;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[/api/admin/log-change] error:", e);
    return NextResponse.json({ error: "Failed to log change" }, { status: 500 });
  }
}
