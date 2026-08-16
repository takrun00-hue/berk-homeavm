import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { rows: changes } = await pool.sql`
      SELECT id, entity_type, entity_id, action, old_value, new_value, changed_by, changed_at
      FROM change_log
      WHERE synced = FALSE
      ORDER BY changed_at DESC
      LIMIT 100
    `;

    return NextResponse.json({
      success: true,
      unsynced_count: changes.length,
      changes: changes.map((c) => ({
        id: c.id,
        entityType: c.entity_type,
        entityId: c.entity_id,
        action: c.action,
        oldValue: c.old_value,
        newValue: c.new_value,
        changedBy: c.changed_by,
        changedAt: c.changed_at,
      })),
    });
  } catch (e) {
    console.error("[/api/changes/sync] GET error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { changeIds } = await req.json();

    if (!Array.isArray(changeIds) || changeIds.length === 0) {
      return NextResponse.json({ error: "Invalid changeIds" }, { status: 400 });
    }

    await pool.sql`
      UPDATE change_log
      SET synced = TRUE
      WHERE id = ANY(${changeIds})
    `;

    return NextResponse.json({ success: true, marked_synced: changeIds.length });
  } catch (e) {
    console.error("[/api/changes/sync] POST error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
