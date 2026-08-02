import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = (process.env.ADMIN_PASSWORD || "").trim();

  if (password === expected) {
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_auth", expected, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  return NextResponse.json(
    { success: false, message: "Yanlış şifre." },
    { status: 401 }
  );
}
