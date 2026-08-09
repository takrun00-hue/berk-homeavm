"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Printer, Share2, Copy, Check } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const getSiteUrl = () => {
  if (typeof window === "undefined") return "https://berk-homeavm.com";
  const { protocol, hostname, port } = window.location;
  const portStr = port ? `:${port}` : "";
  return `${protocol}//${hostname}${portStr}`;
};

async function buildPrintCanvas(qrDataUrl: string): Promise<HTMLCanvasElement> {
  const printCanvas = document.createElement("canvas");
  printCanvas.width = 800;
  printCanvas.height = 1000;

  const ctx = printCanvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 800, 1000);

  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 400;
  ctx.drawImage(qrImg, (800 - qrSize) / 2, 100, qrSize, qrSize);

  ctx.fillStyle = "#0C0C0B";
  ctx.textAlign = "center";
  ctx.font = "bold 48px system-ui, sans-serif";
  ctx.fillText("Berk-HomeAVM", 400, 600);

  ctx.fillStyle = "#C9A84C";
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillText("berk-homeavm.com", 400, 680);

  ctx.fillStyle = "#888888";
  ctx.font = "18px system-ui, sans-serif";
  ctx.fillText("EVİNİZE DEĞER KATAR", 400, 750);

  return printCanvas;
}

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));

const loadImage = (src: string, timeout = 5000): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeoutId = setTimeout(() => {
      reject(new Error(`Image load timeout after ${timeout}ms`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to load image from data URL`));
    };
    img.src = src;
  });
};

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
};

export default function AdminQRPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobUrls = useRef<string[]>([]);
  const [siteUrl, setSiteUrl] = useState("https://berk-homeavm.com");
  const [blobs, setBlobs] = useState<{ small: Blob; large: Blob; print: Blob } | null>(null);
  const [urls, setUrls] = useState<{ small: string; large: string; print: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    const url = getSiteUrl();
    setSiteUrl(url);

    const generateQRCodes = async () => {
      try {
        console.log("[QR] Starting QR generation");

        // Fetch all three QR codes in parallel
        console.log("[QR] Fetching all QR codes in parallel...");
        const [previewRes, smallRes, largeRes] = await Promise.all([
          fetch("/api/admin/qr-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, size: 300, type: "preview" }),
          }),
          fetch("/api/admin/qr-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, size: 320, type: "small" }),
          }),
          fetch("/api/admin/qr-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, size: 480, type: "large" }),
          }),
        ]);

        if (!previewRes.ok || !smallRes.ok || !largeRes.ok) {
          throw new Error(`API error: preview=${previewRes.status}, small=${smallRes.status}, large=${largeRes.status}`);
        }

        const [previewData, smallData, largeData] = await Promise.all([
          previewRes.json(),
          smallRes.json(),
          largeRes.json(),
        ]);

        console.log("[QR] All QR codes fetched, processing...");

        // Render preview to canvas
        if (canvasRef.current && previewData.dataUrl) {
          console.log("[QR] Loading preview image...");
          const previewImg = await loadImage(previewData.dataUrl, 3000);
          const ctx = canvasRef.current.getContext("2d")!;
          canvasRef.current.width = 300;
          canvasRef.current.height = 300;
          ctx.drawImage(previewImg, 0, 0);
          console.log("[QR] Preview rendered");
        }

        // Convert data URLs to blobs
        console.log("[QR] Converting to blobs...");
        const [smallBlob, largeBlob] = await Promise.all([
          dataUrlToBlob(smallData.dataUrl),
          dataUrlToBlob(largeData.dataUrl),
        ]);
        console.log("[QR] Blobs created");

        // Build print canvas
        console.log("[QR] Building print canvas...");
        const printCanvas = await buildPrintCanvas(largeData.dataUrl);
        const printBlob = await canvasToBlob(printCanvas);
        console.log("[QR] Print canvas complete");

        // Create object URLs
        console.log("[QR] Creating object URLs...");
        const smallUrl = URL.createObjectURL(smallBlob);
        const largeUrl = URL.createObjectURL(largeBlob);
        const printUrl = URL.createObjectURL(printBlob);

        blobUrls.current = [smallUrl, largeUrl, printUrl];
        setBlobs({ small: smallBlob, large: largeBlob, print: printBlob });
        setUrls({ small: smallUrl, large: largeUrl, print: printUrl });
        console.log("[QR] Success! QR codes ready");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[QR] Failed:", errorMsg, err);
        setDebugError(errorMsg);
      }
    };

    generateQRCodes();

    return () => {
      blobUrls.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  const handleShare = async () => {
    if (!blobs) return;
    setSharing(true);
    try {
      const file = new File([blobs.small], "berk-homeavm-qr.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Berk-HomeAVM QR Kod", text: siteUrl });
      } else if (navigator.share) {
        await navigator.share({ title: "Berk-HomeAVM", url: siteUrl });
      } else {
        await navigator.clipboard.writeText(siteUrl);
        alert("Adres kopyalandı: " + siteUrl);
      }
    } catch { /* cancelled */ } finally { setSharing(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ready = !!urls;

  return (
    <AdminLayout titleKey="adminQR">
      <div className="max-w-sm space-y-6">

        {debugError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            <p className="font-bold">Hata oluştu:</p>
            <p className="mt-1 font-mono text-xs break-all">{debugError}</p>
          </div>
        )}

        {/* QR preview */}
        <div className="bg-white border rounded-xl p-6 flex flex-col items-center gap-4">
          <div className="bg-white rounded-lg p-2 border shadow-sm inline-block">
            <canvas ref={canvasRef} className="block" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">{siteUrl}</p>
            <p className="text-xs text-gray-400 mt-1">Kamerayı tutun ve siteye gidin</p>
          </div>
        </div>

        {!ready && (
          <p className="text-xs text-gray-400 text-center animate-pulse">Hazırlanıyor...</p>
        )}

        {ready && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">İşlemler</p>

            {/* Share — works on mobile */}
            <button
              onClick={handleShare}
              disabled={sharing}
              className="w-full flex items-center gap-3 bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50"
            >
              <Share2 size={16} className="shrink-0" />
              <span className="text-left">
                <span className="font-bold block">Paylaş / Telefona Kaydet</span>
                <span className="text-xs text-blue-200">iOS & Android için önerilir</span>
              </span>
            </button>

            {/* Copy URL */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 bg-white border rounded-lg px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
            >
              {copied ? <Check size={16} className="text-green-600 shrink-0" /> : <Copy size={16} className="text-gray-500 shrink-0" />}
              <span className="text-left">
                <span className="font-bold block">{copied ? "Kopyalandı!" : "URL Kopyala"}</span>
                <span className="text-xs text-gray-400">berk-homeavm.com</span>
              </span>
            </button>

            {/* Small PNG download */}
            <DownloadLink href={urls!.small} filename="berk-homeavm-qr-kucuk.png">
              <Download size={16} className="text-gold shrink-0" />
              <span className="text-left">
                <span className="font-bold block">Küçük PNG</span>
                <span className="text-xs text-gray-400">320×320 px</span>
              </span>
            </DownloadLink>

            {/* Large PNG download */}
            <DownloadLink href={urls!.large} filename="berk-homeavm-qr-buyuk.png">
              <Download size={16} className="text-gold shrink-0" />
              <span className="text-left">
                <span className="font-bold block">Büyük PNG</span>
                <span className="text-xs text-gray-400">480×480 px</span>
              </span>
            </DownloadLink>

            {/* Print version download */}
            <DownloadLink href={urls!.print} filename="berk-homeavm-qr-baski.png" dark>
              <Printer size={16} className="shrink-0" />
              <span className="text-left">
                <span className="font-bold block">Baskı İçin İndir</span>
                <span className="text-xs text-yellow-200/60">Logo ve URL ile birlikte</span>
              </span>
            </DownloadLink>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          QR kodu <span className="font-bold text-gray-600">{new URL(siteUrl).hostname}</span> adresine yönlendirir.
        </p>
      </div>
    </AdminLayout>
  );
}

function DownloadLink({
  href, filename, children, dark,
}: {
  href: string;
  filename: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };

  return (
    <a
      href={href}
      download={filename}
      onClick={handleClick}
      className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors no-underline ${
        dark
          ? "bg-black text-gold border border-black hover:bg-gray-900"
          : "bg-white border text-black hover:bg-gray-50"
      }`}
    >
      {children}
    </a>
  );
}
