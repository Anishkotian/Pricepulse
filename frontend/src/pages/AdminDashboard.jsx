import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import { inr } from "../utils/format";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/stats").then((r) => setStats(r.data)).catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!stats) return <div className="text-slate-500">Loading…</div>;

  const cards = [
    ["Products", stats.total_products],
    ["Shops", stats.total_shops],
    ["Categories", stats.total_categories],
    ["Price records", stats.total_price_records],
  ];
  const maxCount = Math.max(1, ...stats.products_per_category.map((c) => c.count));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-3xl font-extrabold text-brand-700">{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-extrabold text-brand-900 mb-4">Products per category</h2>
          <div className="space-y-3">
            {stats.products_per_category.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{c.category}</span>
                  <b>{c.count}</b>
                </div>
                <div className="h-2 rounded-full bg-brand-50">
                  <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            {stats.records_last_7_days} price record(s) added in the last 7 days · {stats.total_users} registered user(s)
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-extrabold text-brand-900 mb-4">Recently added price records</h2>
          <ul className="divide-y divide-slate-100">
            {stats.recent_prices.map((r) => (
              <li key={r.price_id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{r.product_name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {r.shop_name} · {new Date(r.recorded_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <b className="text-brand-700">{inr(r.price)}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}