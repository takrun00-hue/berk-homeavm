import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

const FALLBACK_UNSPLASH = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800";

// White-background sofa SVG used only when Unsplash redirect also fails
const PLACEHOLDER_SVG = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">` +
  `<rect width="800" height="800" fill="#ffffff"/>` +
  `<rect x="150" y="460" width="500" height="60" rx="24" fill="#9ca3af"/>` +
  `<rect x="150" y="320" width="500" height="140" rx="24" fill="#9ca3af"/>` +
  `<rect x="150" y="240" width="110" height="280" rx="24" fill="#9ca3af"/>` +
  `<rect x="540" y="240" width="110" height="280" rx="24" fill="#9ca3af"/>` +
  `<rect x="175" y="520" width="70" height="60" rx="12" fill="#6b7280"/>` +
  `<rect x="555" y="520" width="70" height="60" rx="12" fill="#6b7280"/>` +
  `</svg>`
);

function placeholderResponse() {
  return new NextResponse(PLACEHOLDER_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function unsplashRedirect() {
  return NextResponse.redirect(FALLBACK_UNSPLASH, {
    status: 302,
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}

async function fetchFromR2(r2: S3Client, bucket: string, key: string) {
  const resp = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await resp.Body?.transformToByteArray();
  if (!bytes || bytes.length === 0) return null;
  return { bytes, contentType: resp.ContentType || "image/jpeg" };
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return placeholderResponse();

  const hasR2 =
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME;

  if (!hasR2) return placeholderResponse();

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const bucket = process.env.R2_BUCKET_NAME!;

  // Try the key as-is first
  try {
    const result = await fetchFromR2(r2, bucket, key);
    if (result) {
      return new NextResponse(Buffer.from(result.bytes), {
        status: 200,
        headers: {
          "Content-Type": result.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
    return unsplashRedirect();
  } catch (err) {
    const errName = (err as any)?.name;
    const errStatus = (err as any)?.$metadata?.httpStatusCode;

    if (errName === "NoSuchKey" || errStatus === 404) {
      // If key has a leading slash, also try without it (old upload bug stored keys with leading /)
      if (key.startsWith("/")) {
        const keyNoSlash = key.slice(1);
        try {
          const result2 = await fetchFromR2(r2, bucket, keyNoSlash);
          if (result2) {
            return new NextResponse(Buffer.from(result2.bytes), {
              status: 200,
              headers: {
                "Content-Type": result2.contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
              },
            });
          }
        } catch {}
      }
      return unsplashRedirect();
    }

    console.error("[/api/images] R2 fetch error:", err instanceof Error ? err.message : String(err));
    return placeholderResponse();
  }
}
