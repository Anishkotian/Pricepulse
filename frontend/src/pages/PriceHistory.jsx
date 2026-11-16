import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { errorMessage } from "../services/api";
import { dateFmt, inr } from "../utils/format";

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d", "#ea580c", "#475569"];

export default function PriceHistory() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [hidden, setHidden] = useState([]);

  useEffect(() => {
    api.get(`/prices/${id}/history`).then((r) => setData(r.data)).catch((e) => setError(errorMessage(e)));
  }, [id]);

  const shops = useMemo(() => (data ? data.per_shop.map((s) => s.shop_name) : []), [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    const map = new Map();
    data.points.forEach((p) => {
      const t = new Date(p.recorded_at).getTime();
      if (!map.has(t)) map.set(t, { t });
      map.get(t)[p.shop_name] = p.price;
    });
    return [...map.values()].sort((a, b) => a.t - b.t);
  }, [data]);

  function toggle(name) {
    setHidden((h) => (h.includes(name) ? h.filter((x) => x !== name) : [...h, name]));
  }

  if (error) return <div className="max-w-3xl mx-auto p-10 text-red-600">{error}</div>;
  if (!data) return <div className="p-10 text-center text-slate-500">Loading…</div>;

  const { product, stats } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to={`/products/${id}`} className="text-sm font-semibold text-brand-700">← Back to comparison</Link>
      <h1 className="text-2xl font-extrabold text-brand-900 mt-3">{product.product_name}</h1>
      <p className="text-slate-500 text-sm mb-6">{product.brand} · {product.unit} · Price history</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Box label="Minimum recorded" value={inr(stats.min_price)} />
        <Box label="Maximum recorded" value={inr(stats.max_price)} />
        <Box label="Average recorded" value={inr(stats.avg_price)} />
        <Box label="Records" value={stats.record_count} />
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {shops.map((name, i) => {
            const off = hidden.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggle(name)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${off ? "bg-white text-slate-400 border-slate-200" : "text-white border-transparent"}`}
                style={off ? {} : { background: COLORS[i % COLORS.length] }}
              >
                {name}
              </button>
            );
          })}
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]}
                tickFormatter={(t) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                fontSize={12}
              />
              <YAxis domain={["auto", "auto"]} tickFormatter={(v) => `₹${v}`} fontSize={12} width={55} />
              <Tooltip labelFormatter={(t) => dateFmt(new Date(t).toISOString())} formatter={(v) => inr(v)} />
              <Legend />
              {shops.map((name, i) =>
                hidden.includes(name) ? null : (
                  <Line key={name} type="monotone" dataKey={name} stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2} dot={{ r: 3 }} connectNulls />
                )
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-400 mt-3">{data.note}</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 mt-6 overflow-x-auto">
        <h2 className="font-extrabold text-brand-900 mb-3">By shop</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="py-2">Shop</th><th>Min</th><th>Max</th><th>Avg</th><th>Records</th><th>Last recorded</th>
            </tr>
          </thead>
          <tbody>
            {data.per_shop.map((s) => (
              <tr key={s.shop_id} className="border-b border-slate-50">
                <td className="py-2 font-semibold">{s.shop_name}</td>
                <td>{inr(s.min_price)}</td><td>{inr(s.max_price)}</td><td>{inr(s.avg_price)}</td>
                <td>{s.record_count}</td><td>{dateFmt(s.last_recorded_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Box({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-extrabold text-brand-700">{value}</div>
    </div>
  );
}