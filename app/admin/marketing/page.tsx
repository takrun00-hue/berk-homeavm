"use client";

import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  TrendingUp, ShoppingBag, DollarSign, Users,
  Star, AlertTriangle, Lightbulb, BarChart2, Package
} from "lucide-react";

interface OrderItem { name: string; quantity: number; unit_price: number; product_id: number; }
interface Order {
  id: number;
  total_price: number;
  subtotal: number;
  tax_amount: number;
  status: string;
  shipping_status: string;
  customer_name: string;
  customer_email: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("tr-TR").format(Math.round(n));
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "bg-black text-gold",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-lg border p-4 flex items-start gap-4">
      <div className={`${color} rounded-full p-3 shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-extrabold truncate">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function generateTips(orders: Order[], totalRevenue: number, avgOrder: number, topProducts: [string, number][]) {
  const tips: { level: "info" | "warning" | "success"; text: string }[] = [];

  if (orders.length === 0) {
    tips.push({ level: "info", text: "Henüz sipariş yok. İlk siparişleri almak için sosyal medya kanallarınızı aktif kullanın ve ürünlerin fotoğraflarını paylaşın." });
    tips.push({ level: "info", text: "WhatsApp Business hesabı açarak müşterilerle doğrudan iletişim kurabilir, satışlarınızı artırabilirsiniz." });
    return tips;
  }

  if (avgOrder < 20000) {
    tips.push({ level: "warning", text: `Ortalama sipariş tutarı (${formatPrice(avgOrder)} ₺) düşük. Ürün paketi teklifleri ve ücretsiz kargo eşiği belirleyerek sepet değerini artırabilirsiniz.` });
  }

  if (avgOrder >= 30000) {
    tips.push({ level: "success", text: `Ortalama sipariş değeri yüksek (${formatPrice(avgOrder)} ₺). Bu segment için premium ürünler ve özel indirim kartları ekleyin.` });
  }

  const cancelledCount = orders.filter(o => o.status === "cancelled" || o.shipping_status === "cancelled").length;
  if (cancelledCount > orders.length * 0.15) {
    tips.push({ level: "warning", text: `İptal oranı yüksek (%${Math.round(cancelledCount / orders.length * 100)}). Müşterileri siparişten vazgeçmeden önce takip edip sorunlarını çözün.` });
  }

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const thisMonthOrders = orders.filter(o => new Date(o.created_at) >= thisMonth);
  if (thisMonthOrders.length > 0) {
    tips.push({ level: "success", text: `Bu ay ${thisMonthOrders.length} sipariş alındı. ${thisMonthOrders.length < 10 ? "Hedef 10 siparişe ulaşmak için kampanya başlatın." : "Harika gidiş! Kampanyaları sürdürün."}` });
  }

  if (topProducts.length > 0) {
    tips.push({ level: "info", text: `En çok satan ürün: "${topProducts[0][0]}". Bu ürünün sosyal medya reklamlarına bütçe ayırın ve benzer ürünleri vitrine taşıyın.` });
  }

  if (topProducts.length >= 2) {
    tips.push({ level: "info", text: `"${topProducts[0][0]}" ile "${topProducts[1][0]}" ürünlerini paket olarak sunmayı deneyin — çapraz satış dönüşüm oranını %20-30 artırır.` });
  }

  tips.push({ level: "info", text: "Teslim edilen siparişlerden sonra müşterilere otomatik değerlendirme mesajı gönderin. Olumlu yorumlar yeni satışların %35'ini etkiler." });
  tips.push({ level: "info", text: "Sezonluk kampanya: Okul sezonu, bayram ve yılbaşı dönemlerinde ürün fiyatlarına özel indirim ekleyin." });

  if (totalRevenue > 100000) {
    tips.push({ level: "success", text: `Toplam ciro ${formatPrice(totalRevenue)} ₺'ye ulaştı. Trendyol ve Hepsiburada gibi pazaryerlerine açılmayı değerlendirin.` });
  }

  return tips;
}

export default function MarketingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    fetch("/api/admin/migrate").then(() => setMigrated(true)).catch(() => setMigrated(true));
  }, []);

  useEffect(() => {
    if (!migrated) return;
    fetch("/api/admin/orders")
      .then(r => r.json())
      .then(d => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [migrated]);

  const stats = useMemo(() => {
    const active = orders.filter(o => o.status !== "cancelled" && o.shipping_status !== "cancelled");
    const totalRevenue = active.reduce((s, o) => s + o.total_price, 0);
    const totalTax = active.reduce((s, o) => s + (o.tax_amount || Math.round(o.total_price - o.total_price / 1.2)), 0);
    const avgOrder = active.length > 0 ? totalRevenue / active.length : 0;
    const uniqueCustomers = new Set(active.map(o => o.customer_email).filter(Boolean)).size;

    // Product sales aggregation
    const productSales: Record<string, number> = {};
    active.forEach(order => {
      (order.items || []).forEach(item => {
        if (item.name && item.name !== "Silinmiş Ürün") {
          productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        }
      });
    });
    const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // Revenue by day (last 30 days)
    const last30: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      last30[d.toISOString().slice(0, 10)] = 0;
    }
    active.forEach(o => {
      const day = o.created_at?.slice(0, 10);
      if (day && last30[day] !== undefined) last30[day] += o.total_price;
    });

    // Month comparison
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const lastMonth = new Date(thisMonth); lastMonth.setMonth(lastMonth.getMonth() - 1);
    const thisMonthRev = active.filter(o => new Date(o.created_at) >= thisMonth).reduce((s, o) => s + o.total_price, 0);
    const lastMonthRev = active.filter(o => {
      const d = new Date(o.created_at);
      return d >= lastMonth && d < thisMonth;
    }).reduce((s, o) => s + o.total_price, 0);

    const growth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

    return {
      totalRevenue, totalTax, avgOrder, uniqueCustomers,
      orderCount: active.length, topProducts, last30, growth, thisMonthRev
    };
  }, [orders]);

  const tips = useMemo(() => generateTips(orders, stats.totalRevenue, stats.avgOrder, stats.topProducts), [orders, stats]);

  const dayEntries = Object.entries(stats.last30);
  const maxRev = Math.max(...dayEntries.map(([, v]) => v), 1);

  if (loading) {
    return (
      <AdminLayout titleKey="adminMarketing">
        <p className="text-center text-sm text-gray-400 py-12">Veriler yükleniyor...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titleKey="adminMarketing">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={DollarSign} label="Toplam Ciro" value={`${formatPrice(stats.totalRevenue)} ₺`} sub={`KDV: ${formatPrice(stats.totalTax)} ₺`} />
        <StatCard icon={ShoppingBag} label="Toplam Sipariş" value={String(stats.orderCount)} sub={stats.growth !== 0 ? `Bu ay: ${formatPrice(stats.thisMonthRev)} ₺` : "Bu ay sipariş yok"} color="bg-blue-600 text-white" />
        <StatCard icon={TrendingUp} label="Ort. Sipariş" value={`${formatPrice(stats.avgOrder)} ₺`} color="bg-purple-600 text-white" />
        <StatCard icon={Users} label="Müşteri" value={String(stats.uniqueCustomers)} sub="Benzersiz alıcı" color="bg-green-600 text-white" />
      </div>

      {/* Month growth */}
      {stats.growth !== 0 && (
        <div className={`mb-6 rounded-lg p-3 flex items-center gap-3 text-sm font-semibold ${stats.growth > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          <TrendingUp size={18} />
          Geçen aya göre ciro {stats.growth > 0 ? "artış" : "düşüş"}: {Math.abs(stats.growth).toFixed(1)}%
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart (last 30 days) */}
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm font-bold mb-3 flex items-center gap-2">
            <BarChart2 size={16} /> Son 30 Gün Ciro
          </p>
          {dayEntries.every(([, v]) => v === 0) ? (
            <p className="text-xs text-gray-400 text-center py-8">Son 30 günde sipariş yok.</p>
          ) : (
            <div className="flex items-end gap-0.5 h-32">
              {dayEntries.map(([day, rev]) => (
                <div
                  key={day}
                  className="flex-1 bg-gold rounded-sm transition-all"
                  style={{ height: `${(rev / maxRev) * 100}%`, minHeight: rev > 0 ? "4px" : "0" }}
                  title={`${day}: ${formatPrice(rev)} ₺`}
                />
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2 text-right">Son 30 gün</p>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm font-bold mb-3 flex items-center gap-2">
            <Star size={16} /> En Çok Satan Ürünler
          </p>
          {stats.topProducts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Henüz satış verisi yok.</p>
          ) : (
            <div className="space-y-2">
              {stats.topProducts.map(([name, qty], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 text-center rounded-full ${i === 0 ? "bg-gold text-black" : "bg-gray-100 text-gray-600"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{name}</p>
                    <div className="bg-gray-100 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-black rounded-full h-1.5"
                        style={{ width: `${(qty / (stats.topProducts[0]?.[1] || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{qty} adet</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg border mb-6 overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Package size={16} />
          <p className="text-sm font-bold">Son Siparişler</p>
        </div>
        {orders.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">Henüz sipariş yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">#</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">Müşteri</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">Tarih</th>
                  <th className="text-right px-4 py-2 text-xs text-gray-500">KDV Hariç</th>
                  <th className="text-right px-4 py-2 text-xs text-gray-500">KDV</th>
                  <th className="text-right px-4 py-2 text-xs text-gray-500">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 15).map(o => {
                  const kdv = o.tax_amount || Math.round(o.total_price - o.total_price / 1.2);
                  const sub = o.subtotal || Math.round(o.total_price / 1.2);
                  return (
                    <tr key={o.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-400">#{o.id}</td>
                      <td className="px-4 py-2">{o.customer_name || "—"}</td>
                      <td className="px-4 py-2 text-gray-400">{new Date(o.created_at).toLocaleDateString("tr-TR")}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{formatPrice(sub)} ₺</td>
                      <td className="px-4 py-2 text-right text-gray-400">{formatPrice(kdv)} ₺</td>
                      <td className="px-4 py-2 text-right font-bold text-gold">{formatPrice(o.total_price)} ₺</td>
                    </tr>
                  );
                })}
              </tbody>
              {orders.length > 0 && (
                <tfoot className="bg-gray-50 border-t font-bold">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-xs text-gray-500">TOPLAM ({orders.length} sipariş)</td>
                    <td className="px-4 py-2 text-right text-xs">{formatPrice(stats.totalRevenue - stats.totalTax)} ₺</td>
                    <td className="px-4 py-2 text-right text-xs">{formatPrice(stats.totalTax)} ₺</td>
                    <td className="px-4 py-2 text-right text-gold">{formatPrice(stats.totalRevenue)} ₺</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* AI Marketing Bot */}
      <div className="bg-black rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
            <Lightbulb size={16} className="text-black" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Pazarlama Asistanı</p>
            <p className="text-gray-400 text-xs">Satış verilerinize dayalı öneriler</p>
          </div>
        </div>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className={`rounded-lg p-3 flex gap-3 ${
              tip.level === "success" ? "bg-green-900/40 border border-green-700" :
              tip.level === "warning" ? "bg-yellow-900/40 border border-yellow-700" :
              "bg-gray-800 border border-gray-700"
            }`}>
              <div className="shrink-0 mt-0.5">
                {tip.level === "success" && <TrendingUp size={14} className="text-green-400" />}
                {tip.level === "warning" && <AlertTriangle size={14} className="text-yellow-400" />}
                {tip.level === "info" && <Lightbulb size={14} className="text-blue-400" />}
              </div>
              <p className="text-gray-200 text-xs leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
