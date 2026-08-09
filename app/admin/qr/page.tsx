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

export default function AdminQRPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobUrls = useRef<string[]>([]);
  const [siteUrl, setSiteUrl] = useState("https://berk-homeavm.com");
  const [urls, setUrls] = useState<{ small: string; large: string; print: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = getSiteUrl();
    setSiteUrl(url);
    let isMounted = true;

    const init = async () => {
      try {
        console.log("[QR] Initializing QR codes for:", url);

        // Fetch all QR codes
        console.log("[QR] Fetching QR codes...");
        const responses = await Promise.all([
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

        for (const res of responses) {
          if (!res.ok) throw new Error(`API returned ${res.status}`);
        }

        const [preview, small, large] = await Promise.all(
          responses.map(r => r.json())
        );

        if (!isMounted) return;

        console.log("[QR] QR codes received, creating blobs...");

        // Convert data URLs directly to blob URLs
        const createBlobUrl = (dataUrl: string) => {
          const arr = dataUrl.split(",");
          const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
          const bstr = atob(arr[1]);
          const n = bstr.length;
          const u8arr = new Uint8Array(n);
          for (let i = 0; i < n; i++) {
            u8arr[i] = bstr.charCodeAt(i);
          }
          return URL.createObjectURL(new Blob([u8arr], { type: mime }));
        };

        const smallUrl = createBlobUrl(small.dataUrl);
        const largeUrl = createBlobUrl(large.dataUrl);

        // Create print version on canvas
        let printUrl = largeUrl; // fallback
        try {
          const printCanvas = document.createElement("canvas");
          printCanvas.width = 800;
          printCanvas.height = 1000;

          const ctx = printCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, 800, 1000);

            // Create image from large QR data URL
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 200, 100, 400, 400);
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
            };
            img.onerror = () => console.warn("[QR] Print canvas image failed, using large QR as fallback");
            img.src = large.dataUrl;

            printCanvas.toBlob((blob) => {
              if (blob && isMounted) {
                printUrl = URL.createObjectURL(blob);
                updateUrls(smallUrl, largeUrl, printUrl);
              }
            }, "image/png");
          }
        } catch (e) {
          console.warn("[QR] Print canvas creation failed:", e);
          // Continue with large QR as print fallback
          updateUrls(smallUrl, largeUrl, largeUrl);
        }

        // Also render preview canvas
        if (canvasRef.current && preview.dataUrl) {
          const previewImg = new Image();
          previewImg.onload = () => {
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx) {
              canvasRef.current!.width = 300;
              canvasRef.current!.height = 300;
              ctx.drawImage(previewImg, 0, 0);
            }
          };
          previewImg.src = preview.dataUrl;
        }

        // Update URLs (might be called twice if print succeeds, but that's fine)
        function updateUrls(s: string, l: string, p: string) {
          if (isMounted) {
            blobUrls.current = [s, l, p];
            setUrls({ small: s, large: l, print: p });
            console.log("[QR] Ready!");
          }
        }

        // If print canvas doesn't update within 500ms, use large as fallback
        setTimeout(() => {
          if (isMounted && !urls) {
            updateUrls(smallUrl, largeUrl, largeUrl);
          }
        }, 500);

      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[QR] Error:", msg);
          setError(msg);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      blobUrls.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  const handleShare = async () => {
    if (!urls) return;
    setSharing(true);
    try {
      if (navigator.share) {
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            <p className="font-bold">خطا:</p>
            <p className="mt-1 break-all">{error}</p>
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
