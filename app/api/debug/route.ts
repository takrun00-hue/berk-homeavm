import { NextResponse } from "next/server";

export async function GET() {
  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const tokenStart = process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 15) || "NOT FOUND";

  return NextResponse.json({
    hasToken,
    tokenStart,
  });
}
