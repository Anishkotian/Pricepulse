import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/stats").then((r) => setStats(r.data)).catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <div className="p-10 text-red-600">{error}</div>;
  if (!stats) return <div className="p-10 text-slate-500">Loading…</div>;

  const cards = [
    ["Products", stats.total_products],
    ["Shops", stats.total_shops],
    ["Categories", stats.total_categories],
    ["Price records", stats.total_price_records],
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold text-brand-900 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-3xl font-extrabold text-brand-700">{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}