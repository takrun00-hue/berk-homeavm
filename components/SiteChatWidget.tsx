"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// تشخیص URL داخل متن و تبدیل آن به لینک قابل‌کلیک
function renderWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function SiteChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { locale } = useLanguage();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/site-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            locale === "tr"
              ? "Üzgünüz, bir hata oluştu."
              : "Sorry, an error occurred.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-40 right-4 z-50 w-[85vw] max-w-sm h-[60vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border md:bottom-24">
          <div className="bg-black text-gold px-4 py-3 flex justify-between items-center">
            <span className="font-bold text-sm">
              {locale === "tr" ? "Canlı Destek" : "Live Support"}
            </span>
            <button onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">
                {locale === "tr"
                  ? "Merhaba! Size nasıl yardımcı olabilirim?"
                  : "Hello! How can I help you?"}
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-xs whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  {renderWithLinks(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-400">
                  ...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={locale === "tr" ? "Mesajınızı yazın..." : "Type your message..."}
              className="flex-1 border rounded-md px-3 py-2 text-xs outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-black text-gold rounded-md px-3 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-4 z-40 bg-black text-gold rounded-full p-4 shadow-lg md:bottom-6"
      >
        <MessageCircle size={24} />
      </button>
    </>
  );
}
