import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const auth = req.cookies.get("admin_auth")?.value;
  if (!auth || auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const blob = await put(`products/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
