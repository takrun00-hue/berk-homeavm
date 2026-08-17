import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";
import { sendDailyReportToTelegram, sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { reportDate, businessName, method } = await req.json();

    if (!reportDate || !businessName || !method) {
      return NextResponse.json(
        { error: "Missing: reportDate, businessName, method (telegram/email/log)" },
        { status: 400 }
      );
    }

    // Get report from database
    const { rows } = await pool.sql`
      SELECT id, report_date, business_name, report_content, status
      FROM admin_reports
      WHERE report_date = ${reportDate} AND business_name = ${businessName}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const report = rows[0];
    const results: Record<string, any> = {};

    if (method === "telegram" || method === "all") {
      const tgResult = await sendDailyReportToTelegram(
        businessName,
        report.report_content,
        report.status
      );
      results.telegram = tgResult.success
        ? { success: true, messageId: tgResult.messageId }
        : { success: false, error: tgResult.error };
    }

    if (method === "email" || method === "all") {
      results.email = {
        success: false,
        message: "Email integration coming soon",
        recipient: "msn.necoo@gmail.com",
      };
    }

    if (method === "log" || method === "all") {
      console.log(`[DAILY REPORT] ${businessName} (${reportDate}):\n${report.report_content}`);
      results.log = { success: true, message: "Report logged to database" };
    }

    // Mark as sent (only if at least one method succeeded)
    const hasSent = Object.values(results).some((r: any) => r.success);
    if (hasSent) {
      await pool.sql`
        UPDATE admin_reports
        SET sent_to_user = TRUE, sent_at = CURRENT_TIMESTAMP
        WHERE report_date = ${reportDate} AND business_name = ${businessName}
      `;
    }

    return NextResponse.json({
      success: hasSent,
      report: {
        date: report.report_date,
        business: report.business_name,
        status: report.status,
      },
      sentVia: results,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[/api/admin/reports/send] error:", e);
    return NextResponse.json({ error: "Failed to send report" }, { status: 500 });
  }
}

