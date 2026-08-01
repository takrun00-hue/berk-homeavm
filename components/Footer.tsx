"use client";

import Link from "next/link";
import { Home, MapPin, Phone, Mail } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-black text-white pt-10 pb-6 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex flex-col items-center leading-none">
          <Home size={36} className="text-gold" />
          <span className="text-gold font-extrabold text-xl -mt-1">
            {t("brand")}
          </span>
        </div>

        <p className="text-gray-300 text-sm max-w-sm">{t("footerText")}</p>

        <div className="flex items-center gap-2 text-sm text-gray-300 flex-wrap justify-center">
          <Link href="/sales-agreement">{t("salesAgreement")}</Link>
          <span>|</span>
          <Link href="/return-policy">{t("returnPolicy")}</Link>
          <span>|</span>
          <Link href="/privacy">{t("privacy")}</Link>
        </div>

        <div className="space-y-2 text-sm text-gray-300 mt-4">
          <div className="flex items-center justify-center gap-2">
            <MapPin size={16} />
            <span>{t("address")}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Phone size={16} />
            <span dir="ltr">+90 000 000 0000</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Mail size={16} />
            <span dir="ltr">info@example.com</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6 opacity-70 text-xs">
          <span>Visa</span>
          <span>MasterCard</span>
          <span>Troy</span>
        </div>
      </div>
    </footer>
  );
}
