import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const categoryId = params.get("category_id") || "";
  const sort = params.get("sort") || "name";

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get("/products", { params: { q: q || undefined, category_id: categoryId || undefined, sort, limit: 100 } })
      .then((r) => setItems(r.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [q, categoryId, sort]);

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold text-brand-900 mb-4">Find a product</h1>
      <SearchBar initial={q} key={q} />

      <div className="flex flex-wrap items-center gap-3 mt-6">
        <select
          value={categoryId}
          onChange={(e) => setParam("category_id", e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold"
        >
          <option value="name">Name A–Z</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        {(q || categoryId) && (
          <button onClick={() => setParams({})} className="text-sm font-semibold text-brand-700">Clear filters</button>
        )}
        <span className="ml-auto text-sm text-slate-500">{loading ? "" : `${items.length} products`}</span>
      </div>

      {error && <div className="mt-6 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
      {loading && <div className="mt-10 text-center text-slate-500">Loading…</div>}
      {!loading && !error && items.length === 0 && (
        <div className="mt-10 text-center text-slate-500">No products match your search.</div>
      )}

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((p) => <ProductCard key={p.product_id} p={p} />)}
      </div>
    </div>
  );
}