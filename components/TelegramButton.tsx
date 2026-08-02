"use client";

import { MessageCircle } from "lucide-react";

export default function TelegramButton() {
  return (
    <a
      href="https://t.me/BerkHomeAVM_bot"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 z-40 bg-[#0088cc] text-white rounded-full p-4 shadow-lg md:bottom-6"
    >
      <MessageCircle size={24} />
    </a>
  );
}
