import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api, { errorMessage } from "../../services/api";
import Field, { inputClass } from "../../components/Field";
import { inr } from "../../utils/format";

const PAGE = 20;

export default function AdminPrices() {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [productId, setProductId] = useState("");
  const [current, setCurrent] = useState({}); // shop_id -> latest price
  const [values, setValues] = useState({});
  const [when, setWhen] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [records, setRecords] = useState([]);
  const [filterProduct, setFilterProduct] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    api.get("/products", { params: { limit: 100 } }).then((r) => setProducts(r.data)).catch((e) => setError(errorMessage(e)));
    api.get("/shops").then((r) => setShops(r.data)).catch((e) => setError(errorMessage(e)));
  }, []);

  function loadCurrent(id) {
    if (!id) return setCurrent({});
    api
      .get(`/prices/${id}`)
      .then((r) => setCurrent(Object.fromEntries(r.data.prices.map((p) => [p.shop_id, p.price]))))
      .catch(() => setCurrent({}));
  }

  function loadRecords() {
    api
      .get("/prices", { params: { product_id: filterProduct || undefined, limit: PAGE, offset } })
      .then((r) => setRecords(r.data))
      .catch((e) => setError(errorMessage(e)));
  }

  useEffect(() => {
    setValues({});
    loadCurrent(productId);
  }, [productId]);

  useEffect(loadRecords, [filterProduct, offset]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setError("");
    if (!productId) return setError("Choose a product first.");

    const items = [];
    for (const s of shops) {
      const raw = (values[s.shop_id] || "").trim();
      if (!raw) continue;
      if (!/^\d+(\.\d{1,2})?$/.test(raw) || Number(raw) <= 0 || Number(raw) > 1000000) {
        return setError(`Invalid price for ${s.shop_name}: use a number above 0 with up to 2 decimals.`);
      }
      items.push({ shop_id: s.shop_id, price: raw });
    }
    if (items.length === 0) return setError("Enter a price for at least one shop.");

    setBusy(true);
    try {
      const body = { product_id: Number(productId), items };
      if (when) body.recorded_at = when;
      const r = await api.post("/prices/bulk", body);
      setMsg(`Saved ${r.data.inserted} new price record(s). Older prices are kept as history.`);
      setValues({});
      loadCurrent(productId);
      setOffset(0);
      loadRecords();
    } catch (ex) {
      setError(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  async function remove(r) {
    if (!window.confirm(`Delete this record: ${r.product_name} at ${r.shop_name} for ${inr(r.price)}?`)) return;
    try {
      await api.delete(`/prices/record/${r.price_id}`);
      loadRecords();
      loadCurrent(productId);
    } catch (ex) {
      setError(errorMessage(ex));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-900">Prices</h1>

      <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-extrabold text-brand-900">Record new prices</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Product">
            <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select a product…</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>{p.product_name} ({p.unit})</option>
              ))}
            </select>
          </Field>
          <Field label="Date and time (optional, defaults to now)">
            <input type="datetime-local" className={inputClass} value={when} onChange={(e) => setWhen(e.target.value)} />
          </Field>
        </div>

        {productId && (
          <div>
            <p className="text-sm text-slate-500 mb-2">Fill in the shops you checked. Leave the others empty.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {shops.map((s) => (
                <div key={s.shop_id} className="flex items-center gap-3 border border-slate-100 rounded-2xl px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{s.shop_name}</div>
                    <div className="text-xs text-slate-400">
                      {current[s.shop_id] !== undefined ? `Current: ${inr(current[s.shop_id])}` : "No price yet"}
                    </div>
                  </div>
                  <input
                    inputMode="decimal"
                    placeholder="₹"
                    className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={values[s.shop_id] || ""}
                    onChange={(e) => setValues({ ...values, [s.shop_id]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}
        {msg && <div className="rounded-xl bg-brand-50 text-brand-700 text-sm px-4 py-3">{msg}</div>}
        <button disabled={busy} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-2.5">
          {busy ? "Saving…" : "Save prices"}
        </button>
      </form>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="font-extrabold text-brand-900">Price records (newest first)</h2>
          <select
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
            value={filterProduct}
            onChange={(e) => { setOffset(0); setFilterProduct(e.target.value); }}
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2">Recorded</th><th>Product</th><th>Shop</th><th>Price</th><th>By</th><th></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.price_id} className="border-b border-slate-50">
                  <td className="py-2 whitespace-nowrap">
                    {new Date(r.recorded_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td>{r.product_name}</td>
                  <td>{r.shop_name}</td>
                  <td className="font-semibold">{inr(r.price)}</td>
                  <td className="text-slate-500">{r.submitted_by_name || "Sample data"}</td>
                  <td>
                    <button onClick={() => remove(r)} aria-label="Delete" className="text-slate-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && <div className="p-6 text-center text-slate-500 text-sm">No records.</div>}
        </div>

        <div className="flex justify-between mt-4">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE))}
            className="text-sm font-semibold text-brand-700 disabled:text-slate-300"
          >
            ← Newer
          </button>
          <button
            disabled={records.length < PAGE}
            onClick={() => setOffset(offset + PAGE)}
            className="text-sm font-semibold text-brand-700 disabled:text-slate-300"
          >
            Older →
          </button>
        </div>
      </div>
    </div>
  );
}