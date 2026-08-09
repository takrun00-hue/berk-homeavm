"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/context/LanguageContext";

interface ExtraField { label: string; value: string; }

export default function AdminSettingsPage() {
  const [form, setForm] = useState({ contact_phone: "", contact_email: "", contact_address: "" });
  const [extras, setExtras] = useState<ExtraField[]>([]);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setSaveError(d.error);
          setLoading(false);
          return;
        }
        setForm({
          contact_phone: d.settings?.contact_phone || "",
          contact_email: d.settings?.contact_email || "",
          contact_address: d.settings?.contact_address || "",
        });
        try {
          setExtras(JSON.parse(d.settings?.contact_extra_fields || "[]"));
        } catch { setExtras([]); }
        setLoading(false);
      })
      .catch((err) => {
        setSaveError("Ayarlar yüklenemedi: " + (err instanceof Error ? err.message : "Bilinmeyen hata"));
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false); setSaveError("");
  };

  const updateExtra = (i: number, field: keyof ExtraField, val: string) => {
    const next = extras.map((x, idx) => idx === i ? { ...x, [field]: val } : x);
    setExtras(next);
    setSaved(false);
  };

  const addExtra = () => { setExtras([...extras, { label: "", value: "" }]); setSaved(false); };
  const removeExtra = (i: number) => { setExtras(extras.filter((_, idx) => idx !== i)); setSaved(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false); setSaveError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, contact_extra_fields: JSON.stringify(extras) }),
      });
      const data = await res.json();
      if (res.ok && data.success) setSaved(true);
      else setSaveError(data.error || "Kayıt başarısız.");
    } catch { setSaveError("Bağlantı hatası."); }
  };

  return (
    <AdminLayout titleKey="adminContact">
      <div className="max-w-md">
        {loading ? (
          <p className="text-sm text-gray-500">{t("loading")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 bg-white border rounded-md p-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sabit Alanlar</p>
              <input
                name="contact_phone"
                placeholder={t("adminPhone")}
                value={form.contact_phone}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <input
                name="contact_email"
                placeholder={t("adminEmail")}
                value={form.contact_email}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <input
                name="contact_address"
                placeholder={t("adminAddress")}
                value={form.contact_address}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-white border rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ekstra Alanlar</p>
                <button
                  type="button"
                  onClick={addExtra}
                  className="flex items-center gap-1 text-xs font-bold text-gold bg-black px-2 py-1 rounded"
                >
                  <Plus size={12} /> {t("adminAddField")}
                </button>
              </div>

              {extras.length === 0 && (
                <p className="text-xs text-gray-400">Henüz ekstra alan yok.</p>
              )}

              {extras.map((ex, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    placeholder={t("adminFieldLabel")}
                    value={ex.label}
                    onChange={(e) => updateExtra(i, "label", e.target.value)}
                    className="border rounded px-2 py-1.5 text-sm w-32 shrink-0"
                  />
                  <input
                    placeholder={t("adminFieldValue")}
                    value={ex.value}
                    onChange={(e) => updateExtra(i, "value", e.target.value)}
                    className="border rounded px-2 py-1.5 text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeExtra(i)}
                    className="text-red-500 hover:text-red-700 shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {saved && <p className="text-green-600 text-xs">{t("adminSaved")}</p>}
            {saveError && <p className="text-red-500 text-xs">{saveError}</p>}

            <button className="w-full bg-black text-gold py-3 rounded-md text-sm font-bold">
              {t("adminSave")}
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
