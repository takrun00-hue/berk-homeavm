"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/context/LanguageContext";

const STANDARD_SIZE = 1000;

interface Prod {
  id: number;
  name_tr: string;
  name_en: string;
  image: string;
}

export default function AdminUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Prod[]>([]);
  const [targetProductId, setTargetProductId] = useState("");
  const [applied, setApplied] = useState(false);
  const { locale, t } = useLanguage();

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
  }, []);

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
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
    setApplied(false);
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

  const handleApplyToProduct = async () => {
    if (!resultUrl || !targetProductId) return;

    const res = await fetch(`/api/admin/products/${targetProductId}/image`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: resultUrl }),
    });
    const data = await res.json();
    if (data.success) {
      setApplied(true);
      setProducts((prev) =>
        prev.map((p) =>
          String(p.id) === targetProductId ? { ...p, image: resultUrl } : p
        )
      );
    }
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
          <div className="space-y-4">
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

            <div className="space-y-2 border-t pt-4">
              <p className="font-bold text-sm">{t("adminApplyToProduct")}</p>
              <select
                value={targetProductId}
                onChange={(e) => {
                  setTargetProductId(e.target.value);
                  setApplied(false);
                }}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">{t("adminSelectProduct")}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {locale === "tr" ? p.name_tr : p.name_en}
                  </option>
                ))}
              </select>

              {targetProductId && (
                <div className="flex items-center gap-3 border rounded-md p-2">
                  <div className="relative w-12 h-12 rounded overflow-hidden shrink-0">
                    <Image
                      src={
                        products.find((p) => String(p.id) === targetProductId)
                          ?.image || resultUrl
                      }
                      alt="current"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {t("adminCurrentImage")}
                  </span>
                </div>
              )}

              <button
                onClick={handleApplyToProduct}
                disabled={!targetProductId}
                className="w-full bg-black text-gold py-2 rounded-md text-sm font-bold disabled:opacity-50"
              >
                {t("adminApplyButton")}
              </button>

              {applied && (
                <p className="text-green-600 text-xs text-center">
                  {t("adminApplied")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
