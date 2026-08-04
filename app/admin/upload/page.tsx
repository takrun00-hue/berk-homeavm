"use client";

import { useRef, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/context/LanguageContext";

const STANDARD_SIZE = 1000;

export default function AdminUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = STANDARD_SIZE;
        canvas.height = STANDARD_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas error");

        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;

        ctx.drawImage(
          img,
          sx,
          sy,
          side,
          side,
          0,
          0,
          STANDARD_SIZE,
          STANDARD_SIZE
        );

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject("Blob error");
          },
          "image/jpeg",
          0.9
        );
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setResultUrl(null);
    setLoading(true);

    try {
      const resizedBlob = await resizeImage(file);
      setPreview(URL.createObjectURL(resizedBlob));

      const formData = new FormData();
      formData.append("file", resizedBlob, "product.jpg");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setResultUrl(data.url);
      } else {
        setError(data.error || "Upload failed.");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (resultUrl) navigator.clipboard.writeText(resultUrl);
  };

  return (
    <AdminLayout titleKey="adminUpload">
      <div className="max-w-md space-y-4">
        <p className="text-gray-500 text-xs">{t("adminUploadNote")}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full border rounded-md px-4 py-3 text-sm bg-white"
        />

        {loading && (
          <p className="text-center text-sm text-gray-500">{t("adminUploading")}</p>
        )}

        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

        {preview && (
          <div className="aspect-square w-full max-w-xs rounded-md overflow-hidden border">
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {resultUrl && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">{t("adminCopyLink")}</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={resultUrl}
                className="flex-1 border rounded-md px-3 py-2 text-xs bg-white"
              />
              <button
                onClick={copyToClipboard}
                className="bg-black text-gold px-4 py-2 rounded-md text-xs font-bold"
              >
                {t("adminCopy")}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
