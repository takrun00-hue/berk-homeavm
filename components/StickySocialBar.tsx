"use client";

import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { useSettings } from "@/lib/useSettings";

export default function StickySocialBar() {
  const { settings } = useSettings();

  const links = [
    { key: "social_instagram", icon: Instagram, url: settings.social_instagram },
    { key: "social_facebook", icon: Facebook, url: settings.social_facebook },
    { key: "social_whatsapp", icon: MessageCircle, url: settings.social_whatsapp },
  ].filter((l) => l.url);

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
            className="bg-black text-gold rounded-full p-3 shadow-lg hover:scale-110 transition-transform"
          >
            <Icon size={18} />
          </a>
        );
      })}
    </div>
  );
}
