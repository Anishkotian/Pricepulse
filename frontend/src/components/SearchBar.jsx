import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export default function SearchBar({ initial = "", className = "" }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    navigate(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products");
  }

  return (
    <form onSubmit={submit} className={`flex items-center bg-white rounded-full shadow-lg shadow-brand-900/10 border border-slate-100 p-1.5 ${className}`}>
      <Search className="ml-4 text-slate-400 shrink-0" size={20} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products or brands, e.g. Amul milk"
        className="flex-1 min-w-0 px-3 py-2.5 outline-none bg-transparent"
      />
      <button className="bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full px-6 py-2.5">
        Search
      </button>
    </form>
  );
}