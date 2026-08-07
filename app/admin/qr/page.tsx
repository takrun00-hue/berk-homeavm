"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Printer, Share2, Copy, Check } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { generateQR, renderQRToCanvas } from "@/lib/qrgen";

const SITE_URL = "https://berk-homeavm.com";

function buildPrintCanvas(matrix: number[][]): HTMLCanvasElement {
  const MP = 20, QZ = 6, N = matrix.length;
  const QS = (N + QZ * 2) * MP;
  const PW = QS + 80, PH = QS + 200;
  const off = document.createElement("canvas");
  off.width = PW; off.height = PH;
  const ctx = off.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, PW, PH);
  const qrOff = document.createElement("canvas");
  renderQRToCanvas(matrix, qrOff, MP, QZ, "#000000", "#FFFFFF");
  ctx.drawImage(qrOff, (PW - QS) / 2, 60);
  ctx.fillStyle = "#0C0C0B"; ctx.textAlign = "center";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("Berk-HomeAVM", PW / 2, QS + 100);
  ctx.fillStyle = "#C9A84C"; ctx.font = "14px system-ui, sans-serif";
  ctx.fillText("berk-homeavm.com", PW / 2, QS + 128);
  ctx.fillStyle = "#888888"; ctx.font = "11px system-ui, sans-serif";
  ctx.fillText("EVİNİZE DEĞER KATAR", PW / 2, QS + 150);
  return off;
}

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));

export default function AdminQRPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobUrls = useRef<string[]>([]);
  const [matrix, setMatrix] = useState<number[][] | null>(null);
  const [blobs, setBlobs] = useState<{ small: Blob; large: Blob; print: Blob } | null>(null);
  const [urls, setUrls] = useState<{ small: string; large: string; print: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    setMatrix(generateQR(SITE_URL));
    return () => { blobUrls.current.forEach(URL.revokeObjectURL); };
  }, []);

  useEffect(() => {
    if (!matrix) return;
    if (canvasRef.current) renderQRToCanvas(matrix, canvasRef.current, 10, 4, "#0C0C0B", "#FFFFFF");

    const small = document.createElement("canvas");
    renderQRToCanvas(matrix, small, 16, 4, "#000000", "#FFFFFF");
    const large = document.createElement("canvas");
    renderQRToCanvas(matrix, large, 24, 4, "#000000", "#FFFFFF");
    const print = buildPrintCanvas(matrix);

    Promise.all([canvasToBlob(small), canvasToBlob(large), canvasToBlob(print)]).then(
      ([sb, lb, pb]) => {
        const su = URL.createObjectURL(sb);
        const lu = URL.createObjectURL(lb);
        const pu = URL.createObjectURL(pb);
        blobUrls.current = [su, lu, pu];
        setBlobs({ small: sb, large: lb, print: pb });
        setUrls({ small: su, large: lu, print: pu });
      }
    );
  }, [matrix]);

  const handleShare = async () => {
    if (!blobs) return;
    setSharing(true);
    try {
      const file = new File([blobs.small], "berk-homeavm-qr.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Berk-HomeAVM QR Kod", text: SITE_URL });
      } else if (navigator.share) {
        await navigator.share({ title: "Berk-HomeAVM", url: SITE_URL });
      } else {
        await navigator.clipboard.writeText(SITE_URL);
        alert("Adres kopyalandı: " + SITE_URL);
      }
    } catch { /* cancelled */ } finally { setSharing(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SITE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ready = !!urls;

  return (
    <AdminLayout titleKey="adminQR">
      <div className="max-w-sm space-y-6">

        {/* QR preview */}
        <div className="bg-white border rounded-xl p-6 flex flex-col items-center gap-4">
          <div className="bg-white rounded-lg p-2 border shadow-sm inline-block">
            <canvas ref={canvasRef} className="block" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">{SITE_URL}</p>
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
          QR kodu <span className="font-bold text-gray-600">berk-homeavm.com</span> adresine yönlendirir.
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
