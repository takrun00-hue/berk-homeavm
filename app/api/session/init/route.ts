import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get all unsynced changes (recent updates from other bots/admins)
    const { rows: changes } = await pool.sql`
      SELECT id, entity_type, entity_id, action, old_value, new_value, changed_by, changed_at
      FROM change_log
      WHERE synced = FALSE
      ORDER BY changed_at DESC
      LIMIT 50
    `;

    // Get summary statistics
    const { rows: stats } = await pool.sql`
      SELECT
        entity_type,
        COUNT(*) as change_count,
        MAX(changed_at) as last_change
      FROM change_log
      WHERE synced = FALSE
      GROUP BY entity_type
      ORDER BY last_change DESC
    `;

    // Get recent admin activity
    const { rows: activity } = await pool.sql`
      SELECT
        changed_by,
        COUNT(*) as total_changes,
        MAX(changed_at) as last_activity
      FROM change_log
      WHERE changed_at > NOW() - INTERVAL '24 hours'
      GROUP BY changed_by
      ORDER BY last_activity DESC
    `;

    // Current site settings (important for operations)
    const { rows: settings } = await pool.sql`
      SELECT key, value FROM site_settings
      WHERE key IN ('tax_tier_standard', 'tax_tier_reduced', 'tax_tier_special',
                     'member_discount', 'loyalty_min_orders', 'loyalty_discount',
                     'default_tax_rate', 'active_gateway', 'cargo_webhook_url')
      ORDER BY key
    `;

    // Current inventory status
    const { rows: inventory } = await pool.sql`
      SELECT
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE shipping_status = 'pending') as pending_shipments
    `;

    const summary = {
      timestamp: new Date().toISOString(),
      unsynced_changes: changes.length,
      statistics: {
        by_entity_type: stats.map((s) => ({
          entityType: s.entity_type,
          changeCount: s.change_count,
          lastChange: s.last_change,
        })),
        by_admin: activity.map((a) => ({
          changedBy: a.changed_by,
          totalChanges: a.total_changes,
          lastActivity: a.last_activity,
        })),
      },
      current_settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
      inventory_status: inventory[0] || {},
      recent_changes: changes.map((c) => ({
        id: c.id,
        entityType: c.entity_type,
        entityId: c.entity_id,
        action: c.action,
        oldValue: c.old_value,
        newValue: c.new_value,
        changedBy: c.changed_by,
        changedAt: c.changed_at,
      })),
    };

    return NextResponse.json(summary);
  } catch (e) {
    console.error("[/api/session/init] error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

// Mark changes as synced after reading
export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { changeIds } = await req.json();

    if (!Array.isArray(changeIds)) {
      return NextResponse.json({ error: "changeIds must be an array" }, { status: 400 });
    }

    if (changeIds.length > 0) {
      await pool.sql`
        UPDATE change_log
        SET synced = TRUE
        WHERE id = ANY(${changeIds})
      `;
    }

    return NextResponse.json({
      success: true,
      marked_synced: changeIds.length,
    });
  } catch (e) {
    console.error("[/api/session/init] POST error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
