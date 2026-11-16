import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, Milk, Pencil, Sparkles, Tag, Wheat } from "lucide-react";
import api from "../services/api";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import { getRecent } from "../utils/format";

const ICONS = [Milk, Wheat, Cookie, Sparkles, Pencil];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
    api.get("/products/featured", { params: { limit: 8 } }).then((r) => setFeatured(r.data)).catch(() => {});
    Promise.all(getRecent().map((id) => api.get(`/products/${id}`).then((r) => r.data).catch(() => null)))
      .then((list) => setRecent(list.filter(Boolean)));
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-3xl mx-auto px-4 pt-16 pb-14 text-center">
          <span className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1 rounded-full">
            <Tag size={12} /> Local price comparison
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight text-brand-900">
            Compare Prices. <span className="text-brand-600">Shop Smarter.</span>
          </h1>
          <p className="mt-4 text-slate-600 text-lg">
            See the latest recorded price of everyday products at nearby shops and find the cheapest one.
          </p>
          <SearchBar className="mt-8" />
          <p className="mt-3 text-xs text-slate-400">Demonstration data: sample prices, not live or verified.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-14">
        <section>
          <h2 className="text-xl font-extrabold text-brand-900 mb-4">Popular categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {categories.map((c, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <Link
                  key={c.category_id}
                  to={`/products?category_id=${c.category_id}`}
                  className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-brand-500 hover:shadow-md transition"
                >
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-100 text-brand-700 mb-3">
                    <Icon size={20} />
                  </span>
                  <div className="font-bold text-sm">{c.category_name}</div>
                  <div className="text-xs text-slate-500">{c.product_count} products</div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-brand-900">Featured products</h2>
              <p className="text-sm text-slate-500">Biggest gap between the cheapest and costliest shop</p>
            </div>
            <Link to="/products" className="text-sm font-semibold text-brand-700">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((p) => <ProductCard key={p.product_id} p={p} />)}
          </div>
        </section>

        {recent.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-brand-900 mb-4">Recently compared</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recent.map((p) => <ProductCard key={p.product_id} p={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}