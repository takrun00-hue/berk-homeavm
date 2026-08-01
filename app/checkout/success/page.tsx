"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function SuccessPage() {
  const { locale } = useLanguage();

  return (
    <section className="py-20 px-4 max-w-md mx-auto text-center space-y-4">
      <CheckCircle size={64} className="mx-auto text-green-600" />
      <h1 className="text-2xl font-extrabold">
        {locale === "tr" ? "Siparişiniz Alındı!" : "Order Received!"}
      </h1>
      <p className="text-gray-500 text-sm">
        {locale === "tr"
          ? "Ödemeniz başarıyla tamamlandı. En kısa sürede sizinle iletişime geçeceğiz."
          : "Your payment was successful. We will contact you shortly."}
      </p>
      <Link
        href="/"
        className="inline-block bg-black text-gold px-6 py-3 rounded-md font-bold mt-4"
      >
        {locale === "tr" ? "Ana Sayfaya Dön" : "Back to Home"}
      </Link>
    </section>
  );
}
