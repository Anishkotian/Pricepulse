import { NavLink, Outlet } from "react-router-dom";
import { IndianRupee, Layers, LayoutDashboard, Package, Store } from "lucide-react";

const tabs = [
  ["/admin", "Dashboard", LayoutDashboard, true],
  ["/admin/products", "Products", Package, false],
  ["/admin/shops", "Shops", Store, false],
  ["/admin/categories", "Categories", Layers, false],
  ["/admin/prices", "Prices", IndianRupee, false],
];

export default function AdminLayout() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:flex gap-8">
      <aside className="md:w-52 shrink-0 mb-6 md:mb-0">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 hidden md:block">Admin</div>
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:sticky md:top-24">
          {tabs.map(([to, label, Icon, end]) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive ? "bg-brand-600 text-white shadow" : "bg-white border border-slate-100 text-slate-600 hover:text-brand-700"
                }`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="flex-1 min-w-0">
        <Outlet />
      </section>
    </div>
  );
}