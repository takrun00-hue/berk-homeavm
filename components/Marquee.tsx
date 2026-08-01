"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function Marquee() {
  const { t } = useLanguage();
  const text = t("marquee");

  return (
    <div className="bg-black overflow-hidden py-2">
      <div className="flex whitespace-nowrap animate-marquee">
        {Array(6)
          .fill(text)
          .map((tItem, i) => (
            <span key={i} className="text-white font-bold mx-4">
              {tItem}
            </span>
          ))}
      </div>
    </div>
  );
}
