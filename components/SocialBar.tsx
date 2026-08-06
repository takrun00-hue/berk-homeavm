"use client";

import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { useSettings } from "@/lib/useSettings";

export default function SocialBar() {
  const { settings } = useSettings();

  const links = [
    {
      key: "social_instagram",
      icon: Instagram,
      url: settings.social_instagram,
    },
    {
      key: "social_facebook",
      icon: Facebook,
      url: settings.social_facebook,
    },
    {
      key: "social_whatsapp",
      icon: MessageCircle,
      url: settings.social_whatsapp,
    },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <div className="flex justify-center gap-4 py-4">
      {links.map((l) => {
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
