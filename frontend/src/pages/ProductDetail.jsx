import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calculator, LineChart, MapPin, Trophy } from "lucide-react";
import api, { errorMessage } from "../services/api";
import { addRecent, dateFmt, inr } from "../utils/format";

export default function ProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(5);
  const [calc, setCalc] = useState(null);
  const [calcError, setCalcError] = useState("");

  useEffect(() => {
    setData(null);
    setCalc(null);
    api
      .get(`/prices/${id}`)
      .then((r) => {
        setData(r.data);
        addRecent(Number(id));
      })
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  async function calculate(e) {
    e.preventDefault();
    setCalcError("");
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1 || n > 10000) {
      setCalc(null);
      return setCalcError("Enter a whole number between 1 and 10000.");
    }
    try {
      const r = await api.get(`/prices/${id}/savings`, { params: { quantity: n } });
      setCalc(r.data);
    } catch (err) {
      setCalcError(errorMessage(err));
    }
  }

  if (error) return <div className="max-w-3xl mx-auto p-10 text-red-600">{error}</div>;
  if (!data) return <div className="p-10 text-center text-slate-500">Loading…</div>;

  const { product, prices } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to="/products" className="text-sm font-semibold text-brand-700">← All products</Link>

      <div className="mt-4 grid md:grid-cols-[320px_1fr] gap-8">
        <aside className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="aspect-square bg-brand-50">
              {product.image_url && (
                <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover"
                     onError={(e) => (e.currentTarget.style.display = "none")} />
              )}
            </div>
            <div className="p-5">
              <span className="text-xs font-semibold text-brand-700">{product.category_name}</span>
              <h1 className="text-xl font-extrabold leading-snug">{product.product_name}</h1>
              <p className="text-slate-500 text-sm">{product.brand} · {product.unit}</p>
            </div>
          </div>
          <Link
            to={`/products/${id}/history`}
            className="flex items-center justify-center gap-2 bg-white border border-brand-500 text-brand-700 font-semibold rounded-2xl py-3 hover:bg-brand-50"
          >
            <LineChart size={18} /> View price history
          </Link>
        </aside>

        <section className="space-y-6">
          {prices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-slate-500">
              No prices have been recorded for this product yet.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Cheapest" value={inr(data.lowest_price)} accent />
                <Stat label="Most expensive" value={inr(data.highest_price)} />
                <Stat label="Price gap" value={inr(data.difference)} />
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <h2 className="font-extrabold text-brand-900 mb-3">
                  Latest recorded price at {data.shop_count} {data.shop_count === 1 ? "shop" : "shops"}
                </h2>
                <ul className="space-y-2">
                  {prices.map((s) => (
                    <li
                      key={s.shop_id}
                      className={`flex items-center gap-4 rounded-2xl px-4 py-3 border ${
                        s.is_cheapest ? "border-brand-500 bg-brand-50" : "border-slate-100"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold flex items-center gap-2 flex-wrap">
                          {s.shop_name}
                          {s.is_cheapest && (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-brand-600 text-white px-2 py-0.5 rounded-full">
                              <Trophy size={11} /> Cheapest
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin size={12} /> {s.location}
                        </div>
                        <div className="text-xs text-slate-400">Recorded on {dateFmt(s.recorded_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-extrabold ${s.is_cheapest ? "text-brand-700" : ""}`}>{inr(s.price)}</div>
                        {!s.is_cheapest && <div className="text-xs text-red-500">+{inr(s.extra_vs_cheapest)}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 mt-3">{data.note}</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <h2 className="font-extrabold text-brand-900 mb-1 flex items-center gap-2">
                  <Calculator size={18} /> Savings calculator
                </h2>
                <p className="text-sm text-slate-500 mb-3">Savings = (Highest Price − Lowest Price) × Quantity</p>
                <form onSubmit={calculate} className="flex gap-2">
                  <input
                    type="number" min="1" max="10000" value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-32 rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button className="bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl px-5">Calculate</button>
                </form>
                {calcError && <p className="text-sm text-red-600 mt-2">{calcError}</p>}
                {calc && (
                  <div className="mt-4 rounded-2xl bg-brand-50 p-4 text-sm space-y-1">
                    <div>Buying {calc.quantity} at <b>{calc.cheapest_shop}</b>: {inr(calc.total_at_cheapest)}</div>
                    <div>Buying {calc.quantity} at <b>{calc.highest_shop}</b>: {inr(calc.total_at_highest)}</div>
                    <div className="text-lg font-extrabold text-brand-700 pt-1">You save {inr(calc.savings)}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`rounded-2xl p-4 border ${accent ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-100"}`}>
      <div className={`text-xs ${accent ? "text-brand-100" : "text-slate-500"}`}>{label}</div>
      <div className="text-xl font-extrabold">{value}</div>
    </div>
  );
}