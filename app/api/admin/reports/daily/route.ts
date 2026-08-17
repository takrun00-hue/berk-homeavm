import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

interface BusinessReport {
  name: string;
  status: "healthy" | "warning" | "critical";
  stats: {
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    failedOrders: number;
  };
  alerts: string[];
  recentChanges: number;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const reportDate = new Date().toISOString().split("T")[0];

    // Berk-HomaVM Stats
    const [
      { rows: productStats },
      { rows: orderStats },
      { rows: revenueStats },
      { rows: pendingOrders },
      { rows: failedOrders },
      { rows: changeLog },
      { rows: settings },
    ] = await Promise.all([
      pool.sql`SELECT COUNT(*) as total FROM products`,
      pool.sql`SELECT COUNT(*) as total FROM orders`,
      pool.sql`SELECT COALESCE(SUM(total_price), 0) as revenue FROM orders WHERE created_at::date = CURRENT_DATE`,
      pool.sql`SELECT COUNT(*) as count FROM orders WHERE shipping_status = 'pending'`,
      pool.sql`SELECT COUNT(*) as count FROM orders WHERE status = 'failed'`,
      pool.sql`SELECT COUNT(*) as count FROM change_log WHERE changed_at::date = CURRENT_DATE`,
      pool.sql`SELECT key, value FROM site_settings WHERE key IN ('active_gateway', 'cargo_webhook_url')`,
    ]);

    const alerts: string[] = [];

    // Check for problems
    if (failedOrders[0]?.count > 0) {
      alerts.push(`⚠️ ${failedOrders[0].count} failed orders found`);
    }

    if (pendingOrders[0]?.count > 5) {
      alerts.push(`⚠️ ${pendingOrders[0]?.count} orders pending shipment`);
    }

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    if (!settingsMap.active_gateway || settingsMap.active_gateway === "none") {
      alerts.push("⚠️ No payment gateway configured");
    }

    if (!settingsMap.cargo_webhook_url) {
      alerts.push("⚠️ Cargo webhook not configured");
    }

    // Get low stock products (if you have stock column)
    const { rows: lowStock } = await pool.sql`
      SELECT COUNT(*) as count FROM products
      WHERE image IS NOT NULL AND description_tr IS NOT NULL
      LIMIT 1
    `;

    const berkHomaVMReport: BusinessReport = {
      name: "Berk-HomaVM (Household Products Store)",
      status: alerts.length > 2 ? "critical" : alerts.length > 0 ? "warning" : "healthy",
      stats: {
        totalProducts: Number(productStats[0]?.total) || 0,
        totalOrders: Number(orderStats[0]?.total) || 0,
        pendingOrders: Number(pendingOrders[0]?.count) || 0,
        totalRevenue: Number(revenueStats[0]?.revenue) || 0,
        failedOrders: Number(failedOrders[0]?.count) || 0,
      },
      alerts,
      recentChanges: Number(changeLog[0]?.count) || 0,
    };

    // Generate report text
    const reportText = generateReportText(berkHomaVMReport, reportDate);

    // Store report in database
    await pool.sql`
      INSERT INTO admin_reports (report_date, business_name, report_content, status)
      VALUES (${reportDate}, 'berk-homeavm', ${reportText}, ${berkHomaVMReport.status})
      ON CONFLICT (report_date, business_name) DO UPDATE
      SET report_content = ${reportText}, status = ${berkHomaVMReport.status}
    `;

    return NextResponse.json({
      success: true,
      reportDate,
      report: berkHomaVMReport,
      reportText,
    });
  } catch (e) {
    console.error("[/api/admin/reports/daily] GET error:", e);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}

function generateReportText(report: BusinessReport, date: string): string {
  const statusEmoji = {
    healthy: "✅",
    warning: "⚠️",
    critical: "🚨",
  };

  return `
📊 **${report.name} - Daily Report**
📅 Date: ${date}
Status: ${statusEmoji[report.status]} ${report.status.toUpperCase()}

📈 **STATISTICS**
├─ Total Products: ${report.stats.totalProducts}
├─ Total Orders (All-time): ${report.stats.totalOrders}
├─ Pending Shipments: ${report.stats.pendingOrders}
├─ Daily Revenue: ${formatPrice(report.stats.totalRevenue)}
└─ Failed Orders Today: ${report.stats.failedOrders}

🔔 **ALERTS** (${report.alerts.length})
${report.alerts.length > 0 ? report.alerts.map((a) => `├─ ${a}`).join("\n") : "└─ No alerts"}

🔄 **ACTIVITY**
└─ Changes logged today: ${report.recentChanges}

---
Generated: ${new Date().toISOString()}
  `.trim();
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}
