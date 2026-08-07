"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/lib/useSettings";
import SocialBar from "./SocialBar";

export default function Footer() {
  const { t } = useLanguage();
  const { settings } = useSettings();

  return (
    <footer className="bg-black text-white pt-10 pb-6 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/logo.jpg"
          alt="Berk-HomeAVM"
          width={100}
          height={100}
          className="rounded-full object-cover"
        />

        <p className="text-gray-300 text-sm max-w-sm">{t("footerText")}</p>

        <SocialBar />

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
            <span>{settings.contact_address || "-"}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Phone size={16} />
            <span dir="ltr">{settings.contact_phone || "-"}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Mail size={16} />
            <span dir="ltr">{settings.contact_email || "-"}</span>
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
