import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { inr } from "../utils/format";

export default function ProductCard({ p }) {
  return (
    <Link
      to={`/products/${p.product_id}`}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-brand-900/10 hover:-translate-y-0.5 transition overflow-hidden flex flex-col"
    >
      <div className="aspect-square bg-brand-50 overflow-hidden">
        {p.image_url && (
          <img
            src={p.image_url}
            alt={p.product_name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <span className="text-xs font-semibold text-brand-700">{p.category_name}</span>
        <h3 className="font-bold leading-snug text-slate-900">{p.product_name}</h3>
        <p className="text-sm text-slate-500">{p.brand} · {p.unit}</p>
        <div className="mt-auto pt-3 flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Lowest recorded</div>
            <div className="text-xl font-extrabold text-brand-700">{inr(p.lowest_price)}</div>
          </div>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Store size={14} /> {p.shop_count} {p.shop_count === 1 ? "shop" : "shops"}
          </span>
        </div>
      </div>
    </Link>
  );
}