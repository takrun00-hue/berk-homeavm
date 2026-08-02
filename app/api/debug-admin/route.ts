import { NextResponse } from "next/server";

export async function GET() {
  const pw = process.env.ADMIN_PASSWORD || "NOT SET";
  return NextResponse.json({
    length: pw.length,
    firstChar: pw[0],
    lastChar: pw[pw.length - 1],
  });
}
