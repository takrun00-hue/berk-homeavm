"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { generateQR, renderQRToCanvas } from "@/lib/qrgen";

const SITE_URL = "https://berk-homeavm.com";

function buildPrintUrl(matrix: number[][]): string {
  const MP = 20, QZ = 6;
  const N = matrix.length;
  const QS = (N + QZ * 2) * MP;
  const PW = QS + 80, PH = QS + 200;

  const off = document.createElement("canvas");
  off.width = PW;
  off.height = PH;
  const ctx = off.getContext("2d")!;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, PW, PH);

  const qrOff = document.createElement("canvas");
  renderQRToCanvas(matrix, qrOff, MP, QZ, "#000000", "#FFFFFF");
  ctx.drawImage(qrOff, (PW - QS) / 2, 60);

  ctx.fillStyle = "#0C0C0B";
  ctx.textAlign = "center";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("Berk-HomeAVM", PW / 2, QS + 100);

  ctx.fillStyle = "#C9A84C";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText("berk-homeavm.com", PW / 2, QS + 128);

  ctx.fillStyle = "#888888";
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText("EVİNİZE DEĞER KATAR", PW / 2, QS + 150);

  return off.toDataURL("image/png");
}

function buildQRUrl(matrix: number[][], modulePx: number): string {
  const off = document.createElement("canvas");
  renderQRToCanvas(matrix, off, modulePx, 4, "#000000", "#FFFFFF");
  return off.toDataURL("image/png");
}

export default function AdminQRPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrix, setMatrix] = useState<number[][] | null>(null);
  const [smallUrl, setSmallUrl] = useState("");
  const [largeUrl, setLargeUrl] = useState("");
  const [printUrl, setPrintUrl] = useState("");

  useEffect(() => {
    const m = generateQR(SITE_URL);
    setMatrix(m);
  }, []);

  useEffect(() => {
    if (!matrix) return;

    if (canvasRef.current) {
      renderQRToCanvas(matrix, canvasRef.current, 10, 4, "#0C0C0B", "#FFFFFF");
    }

    setSmallUrl(buildQRUrl(matrix, 16));
    setLargeUrl(buildQRUrl(matrix, 24));
    setPrintUrl(buildPrintUrl(matrix));
  }, [matrix]);

  const ready = !!matrix;

  return (
    <AdminLayout titleKey="adminQR">
      <div className="max-w-sm space-y-6">
        <div className="bg-white border rounded-xl p-6 flex flex-col items-center gap-4">
          <div className="bg-white rounded-lg p-2 border shadow-sm inline-block">
            <canvas
              ref={canvasRef}
              className="block"
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          <div className="text-center">
            <p className="font-bold text-sm">{SITE_URL}</p>
            <p className="text-xs text-gray-400 mt-1">
              Kamerayı tutun ve siteye gidin
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
            İndir
          </p>

          <a
            href={smallUrl || "#"}
            download="berk-homeavm-qr-kucuk.png"
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!ready}
            className={`w-full flex items-center gap-3 bg-white border rounded-lg px-4 py-3 text-sm transition-colors no-underline text-black ${
              ready ? "hover:bg-gray-50 cursor-pointer" : "opacity-40 pointer-events-none"
            }`}
          >
            <Download size={16} className="text-gold shrink-0" />
            <span className="text-left">
              <span className="font-bold block">Küçük PNG</span>
              <span className="text-xs text-gray-400">
                Sosyal medya için (320×320 px)
              </span>
            </span>
          </a>

          <a
            href={largeUrl || "#"}
            download="berk-homeavm-qr-buyuk.png"
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!ready}
            className={`w-full flex items-center gap-3 bg-white border rounded-lg px-4 py-3 text-sm transition-colors no-underline text-black ${
              ready ? "hover:bg-gray-50 cursor-pointer" : "opacity-40 pointer-events-none"
            }`}
          >
            <Download size={16} className="text-gold shrink-0" />
            <span className="text-left">
              <span className="font-bold block">Büyük PNG</span>
              <span className="text-xs text-gray-400">
                Yüksek çözünürlük (480×480 px)
              </span>
            </span>
          </a>

          <a
            href={printUrl || "#"}
            download="berk-homeavm-qr-baski.png"
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!ready}
            className={`w-full flex items-center gap-3 bg-black text-gold border border-black rounded-lg px-4 py-3 text-sm transition-colors no-underline ${
              ready ? "hover:bg-gray-900 cursor-pointer" : "opacity-40 pointer-events-none"
            }`}
          >
            <Printer size={16} className="shrink-0" />
            <span className="text-left">
              <span className="font-bold block">Baskı İçin İndir</span>
              <span className="text-xs text-yellow-200/60">
                Logo ve URL ile birlikte
              </span>
            </span>
          </a>
        </div>

        <p className="text-xs text-gray-400 text-center">
          QR kodu{" "}
          <span className="font-bold text-gray-600">berk-homeavm.com</span>{" "}
          adresine yönlendirir.
        </p>
      </div>
    </AdminLayout>
  );
}
