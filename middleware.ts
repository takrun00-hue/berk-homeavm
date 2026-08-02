import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const protectedPaths = [
    "/admin/upload",
    "/admin/products",
    "/admin/categories",
    "/admin/settings",
  ];
  const isProtected = protectedPaths.some((p) =>
    req.nextUrl.pathname.startsWith(p)
  );

  if (isProtected) {
    const auth = req.cookies.get("admin_auth")?.value;
    const expected = (process.env.ADMIN_PASSWORD || "").trim();
    if (!auth || auth !== expected) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/upload/:path*",
    "/admin/products/:path*",
    "/admin/categories/:path*",
    "/admin/settings/:path*",
  ],
};
