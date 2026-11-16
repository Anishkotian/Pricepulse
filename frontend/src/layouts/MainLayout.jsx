import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu, Tag, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-full text-sm font-semibold transition ${
    isActive ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:text-brand-700"
  }`;

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/");
  }

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
      <NavLink to="/products" className={linkClass} onClick={() => setOpen(false)}>Products</NavLink>
      {user?.role === "admin" && (
        <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>Admin</NavLink>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-brand-900">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-600 text-white">
              <Tag size={18} />
            </span>
            Price<span className="text-brand-600">Pulse</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">{links}</nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-slate-600">Hi, {user.name.split(" ")[0]}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-red-600"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-brand-700">Log in</Link>
                <Link to="/register" className="text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-full">
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-slate-100 px-4 py-3 flex flex-col gap-1 bg-white">
            {links}
            {user ? (
              <button onClick={handleLogout} className="text-left px-3 py-2 text-sm font-semibold text-red-600">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2 text-sm font-semibold">Log in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="px-3 py-2 text-sm font-semibold text-brand-700">Sign up</Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-500 px-4">
        PricePulse · College DBMS project · All prices are demonstration data, not live or verified prices.
      </footer>
    </div>
  );
}