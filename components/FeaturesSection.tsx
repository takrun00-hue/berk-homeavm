"use client";

import { Smartphone, BadgeCheck, Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    { icon: Smartphone, title: t("feature1Title"), desc: t("feature1Desc") },
    { icon: BadgeCheck, title: t("feature2Title"), desc: t("feature2Desc") },
    { icon: Truck, title: t("feature3Title"), desc: t("feature3Desc") },
  ];

  return (
    <section className="py-14 px-4 grid gap-12 md:grid-cols-3 max-w-5xl mx-auto text-center">
      {features.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex flex-col items-center gap-3">
          <Icon size={48} strokeWidth={1.5} />
          <h3 className="font-extrabold text-xl">{title}</h3>
          <p className="text-gray-500 text-sm max-w-xs">{desc}</p>
        </div>
      ))}
    </section>
  );
}
