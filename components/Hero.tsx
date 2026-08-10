"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const FALLBACK = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600";

export default function Hero() {
  const { t } = useLanguage();
  const [heroUrl, setHeroUrl] = useState(FALLBACK);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        const url = d.settings?.hero_background_url;
        if (url) setHeroUrl(url);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative h-[70vh] w-full flex items-center justify-center text-center px-4 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => setHeroUrl(FALLBACK)}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-white space-y-4 max-w-lg">
        <h1 className="text-3xl md:text-5xl font-extrabold">
          {t("heroTitle")}
        </h1>
        <p className="text-sm md:text-lg text-gray-200">
          {t("heroSubtitle")}
        </p>
        <Link
          href="/contact"
          className="inline-block bg-black border border-gold text-gold px-6 py-3 rounded-md font-bold"
        >
          {t("heroButton")}
        </Link>
      </div>
    </section>
  );
}
