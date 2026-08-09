import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const { url, size, type } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const options = {
      errorCorrectionLevel: "H" as const,
      width: size || 300,
      margin: type === "preview" ? 1 : 2,
      color: {
        dark: type === "preview" ? "#0C0C0B" : "#000000",
        light: "#FFFFFF",
      },
    };

    const dataUrl = await QRCode.toDataURL(url, options);

    return NextResponse.json({ dataUrl });
  } catch (error) {
    console.error("QR code generation failed:", error);
    return NextResponse.json(
      { error: "QR code generation failed" },
      { status: 500 }
    );
  }
}
