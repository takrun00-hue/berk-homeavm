"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { generateQR, renderQRToCanvas } from "@/lib/qrgen";

const SITE_URL = "https://berk-homeavm.com";

export default function AdminQRPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrix, setMatrix] = useState<number[][] | null>(null);

  useEffect(() => {
    const m = generateQR(SITE_URL);
    setMatrix(m);
  }, []);

  useEffect(() => {
    if (matrix && canvasRef.current) {
      renderQRToCanvas(matrix, canvasRef.current, 10, 4, "#0C0C0B", "#FFFFFF");
    }
  }, [matrix]);

  const downloadPNG = (modulePx: number, label: string) => {
    if (!matrix) return;
    const off = document.createElement("canvas");
    renderQRToCanvas(matrix, off, modulePx, 4, "#000000", "#FFFFFF");
    const link = document.createElement("a");
    link.download = `berk-homeavm-qr-${label}.png`;
    link.href = off.toDataURL("image/png");
    link.click();
  };

  const downloadPrint = () => {
    if (!matrix) return;
    const MP = 20, QZ = 6;
    const N = matrix.length;
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

    const link = document.createElement("a");
    link.download = "berk-homeavm-qr-baskı.png";
    link.href = off.toDataURL("image/png");
    link.click();
  };

  return (
    <AdminLayout titleKey="adminQR">
      <div className="max-w-sm space-y-6">
        <div className="bg-white border rounded-xl p-6 flex flex-col items-center gap-4">
          <div className="bg-white rounded-lg p-2 border shadow-sm inline-block">
            <canvas ref={canvasRef} className="block" style={{ imageRendering: "pixelated" }} />
          </div>

          <div className="text-center">
            <p className="font-bold text-sm">{SITE_URL}</p>
            <p className="text-xs text-gray-400 mt-1">Kamerayı tutun ve siteye gidin</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">İndir</p>

          <button
            onClick={() => downloadPNG(16, "kucuk")}
            className="w-full flex items-center gap-3 bg-white border rounded-lg px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Download size={16} className="text-gold shrink-0" />
            <span className="text-left">
              <span className="font-bold block">Küçük PNG</span>
              <span className="text-xs text-gray-400">Sosyal medya için (320×320 px)</span>
            </span>
          </button>

          <button
            onClick={() => downloadPNG(24, "buyuk")}
            className="w-full flex items-center gap-3 bg-white border rounded-lg px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            <Download size={16} className="text-gold shrink-0" />
            <span className="text-left">
              <span className="font-bold block">Büyük PNG</span>
              <span className="text-xs text-gray-400">Yüksek çözünürlük (480×480 px)</span>
            </span>
          </button>

          <button
            onClick={downloadPrint}
            className="w-full flex items-center gap-3 bg-black text-gold border border-black rounded-lg px-4 py-3 text-sm hover:bg-gray-900 transition-colors"
          >
            <Printer size={16} className="shrink-0" />
            <span className="text-left">
              <span className="font-bold block">Baskı İçin İndir</span>
              <span className="text-xs text-yellow-200/60">Logo ve URL ile birlikte</span>
            </span>
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          QR kodu <span className="font-bold text-gray-600">berk-homeavm.com</span> adresine yönlendirir.
        </p>
      </div>
    </AdminLayout>
  );
}
