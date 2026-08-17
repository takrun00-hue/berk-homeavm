import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

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
    const messageId = `report-${reportDate}-${businessName}`;

    // Simulate sending (in production, integrate with Telegram/Email/Slack)
    const results: Record<string, any> = {};

    if (method === "telegram" || method === "all") {
      // TODO: Integrate with Telegram Bot API
      console.log("[TELEGRAM]", report.report_content);
      results.telegram = {
        success: true,
        message: "Report sent to Telegram (simulated)",
        messageId,
      };
    }

    if (method === "email" || method === "all") {
      // TODO: Integrate with Email Service (SendGrid, Mailgun, etc.)
      console.log("[EMAIL]", report.report_content);
      results.email = {
        success: true,
        message: "Report sent to email (simulated)",
        recipient: "msn.necoo@gmail.com",
      };
    }

    if (method === "log" || method === "all") {
      results.log = {
        success: true,
        message: "Report logged to database",
      };
    }

    // Mark as sent
    await pool.sql`
      UPDATE admin_reports
      SET sent_to_user = TRUE, sent_at = CURRENT_TIMESTAMP
      WHERE report_date = ${reportDate} AND business_name = ${businessName}
    `;

    return NextResponse.json({
      success: true,
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
