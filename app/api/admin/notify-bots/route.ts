import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { entityType, entityId, action, oldValue, newValue, botName } = await req.json();

    if (!entityType || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const notificationMessage = `
🔔 **تغییر ادمین: ${entityType.toUpperCase()}**
├─ عمل: ${action}
├─ ID: ${entityId || "N/A"}
├─ مقدار قدیم: ${oldValue || "—"}
├─ مقدار جدید: ${newValue || "—"}
├─ توسط: ${botName || "admin"}
└─ زمان: ${new Date().toISOString()}

**⚠️ توجه:** تمام بات‌ها باید از این تغییر آگاه باشند و overwrite نکنند.
**API:** GET /api/changes/sync برای خواندن تمام تغییرات
    `;

    // Log the notification (in real world, send to Telegram/Slack/Email)
    console.log("[NOTIFICATION]", notificationMessage);

    // Store in database for audit trail
    await pool.sql`
      INSERT INTO change_log (entity_type, entity_id, action, old_value, new_value, changed_by)
      VALUES (${entityType}, ${entityId ? Number(entityId) : null}, ${action}, ${oldValue || null}, ${newValue || null}, ${botName || "admin"})
    `;

    return NextResponse.json({
      success: true,
      notification: notificationMessage,
      message: "✅ تمام بات‌ها مطلع شدند",
    });
  } catch (e) {
    console.error("[/api/admin/notify-bots] error:", e);
    return NextResponse.json({ error: "Failed to notify" }, { status: 500 });
  }
}
