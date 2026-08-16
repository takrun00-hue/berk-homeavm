import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { entityType, entityId, proposedValue, changedBy } = await req.json();

    if (!entityType || proposedValue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Settings-type entities (tax_tier, membership_setting) are logged with a
    // NULL entity_id, so entityId is legitimately absent for them. Match NULL to
    // NULL with IS NOT DISTINCT FROM instead of coercing null to 0.
    const idNum =
      entityId === null || entityId === undefined || entityId === ""
        ? null
        : Number(entityId);

    const { rows } = await pool.sql`
      SELECT id, action, old_value, new_value, changed_by, changed_at
      FROM change_log
      WHERE entity_type = ${entityType}
        AND entity_id IS NOT DISTINCT FROM ${idNum}
      ORDER BY changed_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ hasConflict: false, message: "No recent changes" });
    }

    const lastChange = rows[0];
    const timeSinceChange = Date.now() - new Date(lastChange.changed_at).getTime();
    const thirtyMinutesMs = 30 * 60 * 1000;

    // A conflict is a recent change made by *someone else*. A bot re-checking
    // its own change must not be blocked by it, so the caller may identify
    // itself via changedBy; "system" changes never count as conflicts.
    const byAnotherActor =
      lastChange.changed_by !== "system" &&
      (!changedBy || lastChange.changed_by !== changedBy);
    const hasConflict = timeSinceChange < thirtyMinutesMs && byAnotherActor;

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
