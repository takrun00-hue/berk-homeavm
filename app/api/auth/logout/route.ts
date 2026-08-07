import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  if (token) {
    await destroySession(token);
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set("session_token", "", { maxAge: 0, path: "/" });
  return res;
}
