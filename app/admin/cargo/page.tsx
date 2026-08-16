"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Truck, Package, CheckCircle, Clock, AlertCircle, Search, ChevronDown, ChevronUp, Clipboard, X } from "lucide-react";

interface OrderItem { id: number; name: string; quantity: number; unit_price: number; }
interface Order {
  id: number;
  status: string;
  shipping_status: string;
  cargo_company: string;
  tracking_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_price: number;
  subtotal: number;
  tax_amount: number;
  payment_method: string;
  notes: string;
  created_at: string;
  items: OrderItem[];
}

const SHIPPING_STATUSES = [
  { value: "pending",    label: "Beklemede",        color: "bg-gray-100 text-gray-600" },
  { value: "preparing",  label: "Hazırlanıyor",      color: "bg-yellow-100 text-yellow-700" },
  { value: "shipped",    label: "Kargoya Verildi",   color: "bg-blue-100 text-blue-700" },
  { value: "in_transit", label: "Yolda",             color: "bg-purple-100 text-purple-700" },
  { value: "delivered",  label: "Teslim Edildi",     color: "bg-green-100 text-green-700" },
  { value: "cancelled",  label: "İptal",             color: "bg-red-100 text-red-700" },
];

// Used only until the cargo_companies table has been populated, so the dropdown
// is never empty on an environment that has not run the migration yet.
const FALLBACK_CARGO_COMPANIES = ["PTT Kargo", "Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "Sürat Kargo", "UPS", "DHL", "Diğer"];

function formatPrice(n: number) {
  return new Intl.NumberFormat("tr-TR").format(n);
}

function StatusBadge({ value }: { value: string }) {
  const s = SHIPPING_STATUSES.find(x => x.value === value) || SHIPPING_STATUSES[0];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>;
}

export default function CargoPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<Record<number, Partial<Order>>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [migrated, setMigrated] = useState(false);
  const [manifest, setManifest] = useState<{ text: string; orderId: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [cargoCompanies, setCargoCompanies] = useState<string[]>(FALLBACK_CARGO_COMPANIES);

  useEffect(() => {
    // Auto-migrate DB columns on first load
    fetch("/api/admin/migrate").then(() => setMigrated(true)).catch(() => setMigrated(true));
  }, []);

  useEffect(() => {
    if (!migrated) return;
    fetch("/api/admin/orders")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => setOrders(d.orders || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    // Companies are admin-managed on /admin/cargo-companies; keep the hardcoded
    // fallback if the table is empty or unreachable.
    fetch("/api/admin/cargo-companies")
      .then(r => r.json())
      .then(d => {
        const names = (d.companies || [])
          .filter((c: { is_active: boolean }) => c.is_active)
          .map((c: { name: string }) => c.name);
        if (names.length) setCargoCompanies(names);
      })
      .catch(() => {});
  }, [migrated]);

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === "all" || o.shipping_status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      String(o.id).includes(q) ||
      (o.customer_name || "").toLowerCase().includes(q) ||
      (o.customer_email || "").toLowerCase().includes(q) ||
      (o.tracking_number || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const edit = (id: number, key: string, val: string) => {
    setEditing(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }));
  };

  const save = async (id: number) => {
    setSaving(id);
    const body = editing[id] || {};
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...body } : o));
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    setSaving(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  };

  const generateManifest = (order: Order) => {
    const lines = [
      `📦 KARGO TALEBİ — Sipariş #${order.id}`,
      `Tarih: ${new Date().toLocaleDateString("tr-TR")}`,
      ``,
      `── MÜŞTERİ BİLGİLERİ ──`,
      `Ad: ${order.customer_name || "—"}`,
      `Telefon: ${order.customer_phone || "—"}`,
      `E-posta: ${order.customer_email || "—"}`,
      ``,
      `── TESLİMAT ADRESİ ──`,
      order.shipping_address || "—",
      ``,
      `── ÜRÜNLER ──`,
      ...(order.items || []).map(i => `• ${i.name} × ${i.quantity} — ${formatPrice(i.unit_price * i.quantity)} ₺`),
      ``,
      `Toplam: ${formatPrice(order.total_price)} ₺`,
      `Ödeme: ${order.payment_method || "—"}`,
      order.cargo_company ? `Kargo: ${order.cargo_company}` : "",
      order.notes ? `Not: ${order.notes}` : "",
    ].filter(l => l !== undefined);
    setManifest({ text: lines.join("\n"), orderId: order.id });
    setCopied(false);
  };

  const copyManifest = () => {
    if (!manifest) return;
    navigator.clipboard.writeText(manifest.text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.shipping_status === "pending").length,
    preparing: orders.filter(o => o.shipping_status === "preparing").length,
    shipped: orders.filter(o => o.shipping_status === "shipped").length,
    in_transit: orders.filter(o => o.shipping_status === "in_transit").length,
    delivered: orders.filter(o => o.shipping_status === "delivered").length,
    cancelled: orders.filter(o => o.shipping_status === "cancelled").length,
  };

  return (
    <AdminLayout titleKey="adminCargo">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-2xl font-extrabold">{counts.all}</p>
          <p className="text-xs text-gray-500 mt-1">Toplam Sipariş</p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-3 text-center">
          <p className="text-2xl font-extrabold text-yellow-700">{counts.pending + counts.preparing}</p>
          <p className="text-xs text-yellow-600 mt-1">İşlemdeki</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 text-center">
          <p className="text-2xl font-extrabold text-blue-700">{counts.shipped + counts.in_transit}</p>
          <p className="text-xs text-blue-600 mt-1">Kargoda</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-3 text-center">
          <p className="text-2xl font-extrabold text-green-700">{counts.delivered}</p>
          <p className="text-xs text-green-600 mt-1">Teslim Edildi</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sipariş no, isim, takip no ara..."
            className="w-full pl-8 pr-3 py-2 border rounded-md text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="all">Tümü ({counts.all})</option>
          {SHIPPING_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label} ({counts[s.value as keyof typeof counts] || 0})</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-center text-sm text-gray-400 py-8">Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">
            {orders.length === 0 ? "Henüz sipariş yok." : "Eşleşen sipariş bulunamadı."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const e = editing[order.id] || {};
            const isExpanded = expanded === order.id;
            const currentStatus = e.shipping_status ?? order.shipping_status ?? "pending";
            const currentCargo = e.cargo_company ?? order.cargo_company ?? "";
            const currentTracking = e.tracking_number ?? order.tracking_number ?? "";
            const isDirty = Object.keys(editing[order.id] || {}).length > 0;

            return (
              <div key={order.id} className="bg-white border rounded-lg overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-bold text-sm shrink-0">#{order.id}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{order.customer_name || "—"}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString("tr-TR")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-gold">{formatPrice(order.total_price)} ₺</span>
                    <StatusBadge value={currentStatus} />
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 space-y-4">
                    {/* Customer info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 rounded p-3 space-y-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Müşteri</p>
                        <p>{order.customer_name || "—"}</p>
                        <p className="text-gray-500">{order.customer_email || "—"}</p>
                        <p className="text-gray-500">{order.customer_phone || "—"}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-3 space-y-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Teslimat Adresi</p>
                        <p className="text-sm">{order.shipping_address || "—"}</p>
                      </div>
                    </div>

                    {/* Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="border rounded overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-3 py-2 text-xs text-gray-500">Ürün</th>
                              <th className="text-center px-3 py-2 text-xs text-gray-500">Adet</th>
                              <th className="text-right px-3 py-2 text-xs text-gray-500">Tutar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, i) => (
                              <tr key={i} className="border-t">
                                <td className="px-3 py-2">{item.name}</td>
                                <td className="px-3 py-2 text-center">{item.quantity}</td>
                                <td className="px-3 py-2 text-right">{formatPrice(item.unit_price * item.quantity)} ₺</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t">
                            <tr>
                              <td colSpan={2} className="px-3 py-2 text-xs text-gray-500">KDV Hariç</td>
                              <td className="px-3 py-2 text-right text-xs text-gray-500">{formatPrice(order.subtotal || Math.round(order.total_price / 1.2))} ₺</td>
                            </tr>
                            <tr>
                              <td colSpan={2} className="px-3 py-2 text-xs text-gray-500">KDV (%20)</td>
                              <td className="px-3 py-2 text-right text-xs text-gray-500">{formatPrice(order.tax_amount || Math.round(order.total_price - order.total_price / 1.2))} ₺</td>
                            </tr>
                            <tr>
                              <td colSpan={2} className="px-3 py-2 font-bold text-sm">Toplam</td>
                              <td className="px-3 py-2 text-right font-bold text-gold">{formatPrice(order.total_price)} ₺</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    {/* Cargo form */}
                    <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-bold text-blue-800 flex items-center gap-2">
                        <Truck size={14} /> Kargo Bilgileri
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Durum</label>
                          <select
                            value={currentStatus}
                            onChange={e => edit(order.id, "shipping_status", e.target.value)}
                            className="w-full border rounded px-2 py-2 text-sm bg-white"
                          >
                            {SHIPPING_STATUSES.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Kargo Şirketi</label>
                          <select
                            value={currentCargo}
                            onChange={e => edit(order.id, "cargo_company", e.target.value)}
                            className="w-full border rounded px-2 py-2 text-sm bg-white"
                          >
                            <option value="">Seçin...</option>
                            {cargoCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Takip No</label>
                          <input
                            value={currentTracking}
                            onChange={e => edit(order.id, "tracking_number", e.target.value)}
                            placeholder="Kargo takip numarası"
                            className="w-full border rounded px-2 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center flex-wrap gap-2">
                        <button
                          onClick={() => save(order.id)}
                          disabled={!isDirty || saving === order.id}
                          className="px-4 py-2 bg-black text-gold text-xs font-bold rounded disabled:opacity-40 flex items-center gap-2"
                        >
                          {saving === order.id ? "Kaydediliyor..." : "Kaydet"}
                        </button>
                        <button
                          onClick={() => generateManifest(order)}
                          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded flex items-center gap-1.5"
                        >
                          <Clipboard size={12} /> Kargo Talep Et
                        </button>
                        {saved === order.id && (
                          <span className="text-green-600 text-xs flex items-center gap-1">
                            <CheckCircle size={12} /> Kaydedildi
                          </span>
                        )}
                        {order.tracking_number && (
                          <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Takip: <span className="font-mono font-bold">{order.tracking_number}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">
                        <span className="font-semibold">Not:</span> {order.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-2">
        {SHIPPING_STATUSES.map(s => (
          <span key={s.value} className={`text-xs px-2 py-1 rounded-full ${s.color}`}>
            {s.label}
          </span>
        ))}
      </div>

      {/* Cargo manifest modal */}
      {manifest && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setManifest(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-blue-600" />
                <h3 className="font-bold text-sm">Kargo Talep Formu — #{manifest.orderId}</h3>
              </div>
              <button onClick={() => setManifest(null)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-5">
              <pre className="text-xs bg-gray-50 rounded-lg p-4 whitespace-pre-wrap font-mono border text-gray-700 max-h-72 overflow-y-auto">
                {manifest.text}
              </pre>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={copyManifest}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black text-gold font-bold text-sm rounded-lg"
                >
                  {copied ? <><CheckCircle size={14} /> Kopyalandı!</> : <><Clipboard size={14} /> Kopyala</>}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Yazdır
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Bu metni kopyalayarak kargo şirketine WhatsApp, e-posta veya sistem üzerinden iletebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
