import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/upload")) {
    const auth = req.cookies.get("admin_auth")?.value;
    if (!auth || auth !== process.env.ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/upload/:path*"],
};
