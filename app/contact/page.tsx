"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <section className="py-16 px-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold text-center mb-6">
        {t("contactTitle")}
      </h1>
      <form className="space-y-4">
        <input
          placeholder={t("formName")}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />
        <input
          placeholder={t("formPhone")}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />
        <textarea
          placeholder={t("formMessage")}
          rows={4}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />
        <button
          type="submit"
          className="w-full bg-black text-gold py-3 rounded-md font-bold"
        >
          {t("formSubmit")}
        </button>
      </form>
    </section>
  );
}
