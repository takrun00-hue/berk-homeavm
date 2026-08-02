import { NextRequest } from "next/server";

export function checkAdmin(req: NextRequest) {
  const auth = req.cookies.get("admin_auth")?.value;
  const expected = (process.env.ADMIN_PASSWORD || "").trim();
  return auth === expected;
}
