"use client";

import { Facebook, MessageCircle, ShoppingBag } from "lucide-react";
import { useSettings } from "@/lib/useSettings";

export default function SocialBar() {
  const { settings } = useSettings();

  const marketplaceLinks = [
    { key: "social_trendyol", label: "Trendyol", url: settings.social_trendyol, bg: "bg-orange-500" },
    { key: "social_hepsiburada", label: "Hepsiburada", url: settings.social_hepsiburada, bg: "bg-orange-600" },
  ].filter((l) => l.url);

  const socialLinks = [
    { key: "social_facebook", icon: Facebook, url: settings.social_facebook },
    { key: "social_whatsapp", icon: MessageCircle, url: settings.social_whatsapp },
  ].filter((l) => l.url);

  if (marketplaceLinks.length === 0 && socialLinks.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 py-4">
      {marketplaceLinks.map((l) => (
        <a
          key={l.key}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 ${l.bg} text-white rounded-md px-3 py-2 text-xs font-bold hover:opacity-90 transition-opacity`}
        >
          <ShoppingBag size={14} />
          {l.label}
        </a>
      ))}
      {socialLinks.map((l) => {
        const Icon = l.icon;
        return (
          <a
            key={l.key}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 hover:bg-gold hover:text-black text-white rounded-full p-2.5 transition-colors"
          >
            <Icon size={18} />
          </a>
        );
      })}
    </div>
  );
}
