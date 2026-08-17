import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/checkAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const days = req.nextUrl.searchParams.get("days") || "7";
    const businessName = req.nextUrl.searchParams.get("business") || null;

    let query = pool.sql`
      SELECT id, report_date, business_name, report_content, status, sent_to_user, sent_at, created_at
      FROM admin_reports
      WHERE report_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
    `;

    if (businessName) {
      query = pool.sql`
        SELECT id, report_date, business_name, report_content, status, sent_to_user, sent_at, created_at
        FROM admin_reports
        WHERE report_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
        AND business_name = ${businessName}
      `;
    }

    query = pool.sql`${query} ORDER BY report_date DESC, business_name ASC`;

    const { rows: reports } = await query;

    // Group by date for easier reading
    const grouped = reports.reduce(
      (acc, report) => {
        const date = report.report_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push({
          id: report.id,
          businessName: report.business_name,
          content: report.report_content,
          status: report.status,
          sentToUser: report.sent_to_user,
          sentAt: report.sent_at,
        });
        return acc;
      },
      {} as Record<string, any[]>
    );

    return NextResponse.json({
      success: true,
      days: parseInt(days),
      businessName: businessName || "all",
      totalReports: reports.length,
      byDate: grouped,
      reports,
    });
  } catch (e) {
    console.error("[/api/admin/reports/history] error:", e);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
