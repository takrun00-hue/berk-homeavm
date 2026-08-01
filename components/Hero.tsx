"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative h-[70vh] w-full flex items-center justify-center text-center px-4">
      <Image
        src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600"
        alt="hero background"
        fill
        priority
        className="object-cover"
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
