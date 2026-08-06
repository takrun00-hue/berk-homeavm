"use client";

import { Facebook, MessageCircle, ShoppingBag } from "lucide-react";
import { useSettings } from "@/lib/useSettings";

export default function StickySocialBar() {
  const { settings } = useSettings();

  const links: { key: string; icon?: React.ElementType; label?: string; url: string; bg: string }[] = [
    { key: "social_trendyol", label: "T", url: settings.social_trendyol, bg: "bg-orange-500" },
    { key: "social_hepsiburada", label: "H", url: settings.social_hepsiburada, bg: "bg-orange-600" },
    { key: "social_facebook", icon: Facebook, url: settings.social_facebook, bg: "bg-black" },
    { key: "social_whatsapp", icon: MessageCircle, url: settings.social_whatsapp, bg: "bg-black" },
  ].filter((l) => l.url) as typeof links;

  if (links.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 z-40 flex flex-col gap-2 md:bottom-6">
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <a
            key={l.key}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${l.bg} text-white rounded-full p-3 shadow-lg hover:scale-110 transition-transform flex items-center justify-center`}
            title={l.label || ""}
          >
            {Icon ? <Icon size={18} /> : <span className="text-sm font-extrabold w-[18px] text-center leading-none">{l.label}</span>}
          </a>
        );
      })}
    </div>
  );
}
