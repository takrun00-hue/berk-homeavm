import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { entityType, entityId, proposedValue } = await req.json();

    if (!entityType || !entityId || proposedValue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get latest change for this entity
    const { rows } = await pool.sql`
      SELECT id, action, old_value, new_value, changed_by, changed_at
      FROM change_log
      WHERE entity_type = ${entityType} AND entity_id = ${Number(entityId)}
      ORDER BY changed_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ hasConflict: false, message: "No recent changes" });
    }

    const lastChange = rows[0];
    const timeSinceChange = Date.now() - new Date(lastChange.changed_at).getTime();
    const thirtyMinutesMs = 30 * 60 * 1000;

    // Conflict if changed within last 30 minutes by different bot
    const hasConflict = timeSinceChange < thirtyMinutesMs && lastChange.changed_by !== "system";

    return NextResponse.json({
      hasConflict,
      lastChange: {
        id: lastChange.id,
        action: lastChange.action,
        oldValue: lastChange.old_value,
        newValue: lastChange.new_value,
        changedBy: lastChange.changed_by,
        changedAt: lastChange.changed_at,
      },
      message: hasConflict
        ? `⚠️ کانفلیک: این ${entityType} توسط ${lastChange.changed_by} تغییر کرده شده است (${Math.floor(timeSinceChange / 1000)} ثانیه پیش). لطفاً قبل از بروزرسانی منتظر بمانید یا تغییرات را مجدداً بررسی کنید.`
        : `✅ هیچ کانفلیک وجود ندارد. شما می‌توانید به‌طور ایمن بروزرسانی کنید.`,
    });
  } catch (e) {
    console.error("[/api/admin/conflict-check] error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
