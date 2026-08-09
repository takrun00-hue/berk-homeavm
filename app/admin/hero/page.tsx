"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Check } from "lucide-react";
import Image from "next/image";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminHeroPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [heroUrl, setHeroUrl] = useState("https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600");
  const [heroPreview, setHeroPreview] = useState("https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600");
  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroUploadedImages, setHeroUploadedImages] = useState<Array<{ url: string; name: string }>>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setError(d.error);
          setLoading(false);
          return;
        }
        const url = d.settings?.hero_background_url || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600";
        setHeroUrl(url);
        setHeroPreview(url);
        setLoading(false);
      })
      .catch(err => {
        setError("Ayarlar yüklenemedi: " + (err instanceof Error ? err.message : "Bilinmeyen hata"));
        setLoading(false);
      });
  }, []);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.url) {
        const fileName = file.name;
        setHeroUploadedImages([
          { url: data.url, name: fileName },
          ...heroUploadedImages
        ]);
        setHeroUrl(data.url);
        setHeroPreview(data.url);
        setSaved(false);
      } else {
        setError(data.error || "Resim yüklenemedi");
      }
    } catch (err) {
      setError("Yükleme hatası: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setUploadingHero(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hero_background_url: heroUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || "Kayıt başarısız");
      }
    } catch (err) {
      setError("Bağlantı hatası");
    }
  };

  return (
    <AdminLayout titleKey="adminHero">
      <div className="max-w-2xl space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">{t("loading")}</p>
        ) : (
          <>
            {/* Current Hero Preview */}
            <div className="space-y-2 bg-white border rounded-md p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Şu Anki Arka Plan</p>
              <div className="relative w-full h-48 bg-gray-100 rounded border overflow-hidden">
                <Image
                  src={heroPreview}
                  alt="Hero background"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Upload Section */}
            <div className="space-y-3 bg-white border rounded-md p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Yeni Görsel Yükle</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleHeroImageUpload}
                disabled={uploadingHero}
                className="hidden"
                id="hero-file-input"
              />
              <label
                htmlFor="hero-file-input"
                className={`block border-2 border-dashed rounded-md px-4 py-6 text-center cursor-pointer transition-colors ${
                  uploadingHero
                    ? "bg-gray-50 border-gray-300 opacity-50 cursor-not-allowed"
                    : "border-gold hover:bg-yellow-50"
                }`}
              >
                <div className="flex items-center justify-center gap-3 text-base">
                  <Upload size={24} className="text-gold" />
                  <div className="text-left">
                    <span className="font-bold text-gray-700 block">
                      {uploadingHero ? "Yükleniyor..." : "Resim Seç veya Sürükle"}
                    </span>
                    <span className="text-xs text-gray-500">JPG, PNG - Max 10MB</span>
                  </div>
                </div>
              </label>
            </div>

            {/* Uploaded Images Gallery */}
            {heroUploadedImages.length > 0 && (
              <div className="space-y-3 bg-white border rounded-md p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Yüklenen Görseller</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {heroUploadedImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setHeroUrl(img.url);
                        setHeroPreview(img.url);
                      }}
                      className={`relative h-24 rounded border-2 cursor-pointer overflow-hidden transition-all ${
                        heroUrl === img.url
                          ? "border-gold ring-2 ring-gold"
                          : "border-gray-200 hover:border-gold"
                      }`}
                      title={img.name}
                    >
                      <Image
                        src={img.url}
                        alt={img.name}
                        fill
                        className="object-cover"
                      />
                      {heroUrl === img.url && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Check size={24} className="text-gold" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual URL Input */}
            <div className="space-y-2 bg-white border rounded-md p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">ya da URL ile</p>
              <input
                type="text"
                placeholder="https://images.unsplash.com/photo-..."
                value={heroUrl}
                onChange={(e) => {
                  setHeroUrl(e.target.value);
                  setHeroPreview(e.target.value);
                }}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400">
                💡 Unsplash'tan bir görselin linkini yapıştırabilirsiniz
              </p>
            </div>

            {/* Messages */}
            {error && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">{error}</div>}
            {saved && <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">✓ Kaydedildi</div>}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={uploadingHero}
              className="w-full bg-black text-gold py-3 rounded-md text-sm font-bold hover:bg-gray-900 disabled:opacity-50"
            >
              Kaydet ve Uygula
            </button>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
