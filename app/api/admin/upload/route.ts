import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: NextRequest) {
  const auth = req.cookies.get("admin_auth")?.value;
  const expected = (process.env.ADMIN_PASSWORD || "").trim();
  if (!auth || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/jpeg";

  const hasR2 =
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME;

  if (hasR2) {
    try {
      const r2 = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });

      const key = `products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          CacheControl: "public, max-age=31536000, immutable",
        })
      );

      const getResp = await r2.send(
        new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key })
      );
      const bytes = await getResp.Body?.transformToByteArray();
      if (bytes && bytes.length > 0) {
        const url = `/api/images?key=${encodeURIComponent(key)}`;
        return NextResponse.json({ url, storage: "r2" });
      }
      console.warn("[upload] R2 verify failed, falling back to base64");
    } catch (r2Error) {
      console.warn("[upload] R2 failed:", r2Error instanceof Error ? r2Error.message : String(r2Error));
    }
  }

  const base64 = buffer.toString("base64");
  const url = `data:${mimeType};base64,${base64}`;
  return NextResponse.json({ url, storage: "base64" });
}
