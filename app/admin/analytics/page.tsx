"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

interface CatStat { category: string; count: number; }
interface PriceStat { min_price: number; max_price: number; avg_price: number; total: number; }
interface DiscountStat { discounted: number; regular: number; }
interface TopProduct { name_tr: string; min_price: number; max_price: number; discount_percent: number; }

function BarChart({ data }: { data: CatStat[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 480, BAR_H = 28, GAP = 8, LABEL_W = 130, PAD = 12;
  const H = data.length * (BAR_H + GAP) + PAD * 2;
  const chartW = W - LABEL_W - PAD;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ fontFamily: "system-ui, sans-serif" }}>
      {data.map((d, i) => {
        const y = PAD + i * (BAR_H + GAP);
        const bw = Math.max(4, (d.count / max) * (chartW - 40));
        return (
          <g key={d.category}>
            <text x={LABEL_W - 6} y={y + BAR_H / 2 + 4} textAnchor="end" fontSize={11} fill="#555" className="truncate">
              {d.category.length > 16 ? d.category.slice(0, 16) + "…" : d.category}
            </text>
            <rect x={LABEL_W} y={y} width={bw} height={BAR_H} rx={4} fill="#C9A84C" />
            <text x={LABEL_W + bw + 6} y={y + BAR_H / 2 + 4} fontSize={11} fill="#333" fontWeight="bold">
              {d.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PriceHistogram({ buckets }: { buckets: { label: string; count: number }[] }) {
  if (!buckets.length) return null;
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const W = 480, H = 120, PAD = 20, BAR_GAP = 4;
  const bw = (W - PAD * 2) / buckets.length - BAR_GAP;

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full" style={{ fontFamily: "system-ui, sans-serif" }}>
      {buckets.map((b, i) => {
        const bh = Math.max(4, (b.count / max) * H);
        const x = PAD + i * (bw + BAR_GAP);
        const y = PAD + H - bh;
        return (
          <g key={b.label}>
            <rect x={x} y={y} width={bw} height={bh} rx={3} fill="#0C0C0B" opacity={0.75} />
            {b.count > 0 && (
              <text x={x + bw / 2} y={y - 3} textAnchor="middle" fontSize={9} fill="#333" fontWeight="bold">
                {b.count}
              </text>
            )}
            <text x={x + bw / 2} y={H + PAD + 14} textAnchor="middle" fontSize={8} fill="#888">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ discounted, regular }: { discounted: number; regular: number }) {
  const total = discounted + regular;
  if (!total) return null;
  const r = 44, cx = 56, cy = 56, stroke = 18;
  const circ = 2 * Math.PI * r;
  const discFrac = discounted / total;
  return (
    <svg viewBox="0 0 112 112" width={112} height={112}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eee" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#C9A84C" strokeWidth={stroke}
        strokeDasharray={`${discFrac * circ} ${(1 - discFrac) * circ}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#0C0C0B">
        {Math.round(discFrac * 100)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="#888">indirimli</text>
    </svg>
  );
}

function makeBuckets(prices: { min_price: number; max_price: number }[]) {
  if (!prices.length) return [];
  const avgs = prices.map((p) => (p.min_price + p.max_price) / 2);
  const min = Math.min(...avgs), max = Math.max(...avgs);
  if (min === max) return [{ label: `${Math.round(min)} ₺`, count: prices.length }];
  const BUCKETS = 6;
  const step = (max - min) / BUCKETS;
  const buckets = Array.from({ length: BUCKETS }, (_, i) => ({
    label: `${Math.round(min + i * step)}`,
    count: 0,
  }));
  avgs.forEach((v) => {
    const idx = Math.min(BUCKETS - 1, Math.floor((v - min) / step));
    buckets[idx].count++;
  });
  return buckets;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [byCategory, setByCategory] = useState<CatStat[]>([]);
  const [priceStats, setPriceStats] = useState<Partial<PriceStat>>({});
  const [discountStats, setDiscountStats] = useState<Partial<DiscountStat>>({});
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [allPrices, setAllPrices] = useState<{ min_price: number; max_price: number }[]>([]);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        setByCategory(d.byCategory || []);
        setPriceStats(d.priceStats || {});
        setDiscountStats(d.discountStats || {});
        setTopProducts(d.topProducts || []);
        setAllPrices(d.allPrices || []);
        setLoading(false);
      });
  }, []);

  const buckets = makeBuckets(allPrices);
  const fmt = (n?: number) => n != null ? n.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " ₺" : "—";

  return (
    <AdminLayout titleKey="adminAnalytics">
      {loading ? (
        <p className="text-sm text-gray-500">Yükleniyor...</p>
      ) : (
        <div className="space-y-6 max-w-2xl">

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Toplam Ürün", value: priceStats.total ?? 0 },
              { label: "İndirimli", value: discountStats.discounted ?? 0 },
              { label: "Ort. Fiyat", value: fmt(priceStats.avg_price) },
              { label: "Kategori", value: byCategory.length },
            ].map((c) => (
              <div key={c.label} className="bg-white border rounded-lg p-3 text-center">
                <p className="text-xl font-extrabold text-black">{c.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Products by category */}
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Kategoriye Göre Ürün Sayısı</p>
            <BarChart data={byCategory} />
          </div>

          {/* Price range + donut side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Fiyat Dağılımı (₺)</p>
              <PriceHistogram buckets={buckets} />
              <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                <span>Min: {fmt(priceStats.min_price)}</span>
                <span>Max: {fmt(priceStats.max_price)}</span>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4 flex flex-col items-center justify-center gap-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide self-start">İndirim Oranı</p>
              <DonutChart
                discounted={discountStats.discounted ?? 0}
                regular={discountStats.regular ?? 0}
              />
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-gold" />
                  İndirimli: {discountStats.discounted ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-gray-200" />
                  Normal: {discountStats.regular ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Top 5 most expensive */}
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">En Pahalı 5 Ürün</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-xs text-gray-400">
                    <th className="text-left py-1 font-medium">Ürün</th>
                    <th className="text-right py-1 font-medium">Min</th>
                    <th className="text-right py-1 font-medium">Max</th>
                    <th className="text-right py-1 font-medium">İndirim</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium max-w-[180px] truncate">{p.name_tr}</td>
                      <td className="py-2 text-right text-gray-600">{fmt(p.min_price)}</td>
                      <td className="py-2 text-right font-bold">{fmt(p.max_price)}</td>
                      <td className="py-2 text-right">
                        {p.discount_percent > 0
                          ? <span className="text-red-500 font-bold">%{p.discount_percent}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center pb-2">
            Veriler bu siteye ait ürünleri yansıtır. Harici pazar karşılaştırması için Trendyol veya Hepsiburada API entegrasyonu gereklidir.
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
