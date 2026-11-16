import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import api, { errorMessage } from "../../services/api";
import Modal from "../../components/Modal";
import Field, { inputClass } from "../../components/Field";
import { inr } from "../../utils/format";

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  function load() {
    api.get("/products", { params: { limit: 100 } }).then((r) => setItems(r.data)).catch((e) => setError(errorMessage(e)));
  }
  useEffect(() => {
    load();
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  async function remove(p) {
    if (!window.confirm(`Delete "${p.product_name}" and all its price records?`)) return;
    setError("");
    try {
      await api.delete(`/products/${p.product_id}`);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const shown = items.filter((p) => `${p.product_name} ${p.brand}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-extrabold text-brand-900">Products</h1>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter…"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
          />
          <button onClick={() => setModal({ item: null })} className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-full px-4 py-2">
            <Plus size={16} /> Add product
          </button>
        </div>
      </div>
      {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="p-4">Product</th><th>Brand</th><th>Category</th><th>Unit</th><th>Lowest</th><th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.product_id} className="border-b border-slate-50">
                <td className="p-4 font-semibold">{p.product_name}</td>
                <td>{p.brand}</td>
                <td>{p.category_name}</td>
                <td>{p.unit}</td>
                <td>{inr(p.lowest_price)}</td>
                <td className="flex gap-3 p-4 text-slate-500">
                  <button onClick={() => setModal({ item: p })} aria-label="Edit"><Pencil size={16} /></button>
                  <button onClick={() => remove(p)} aria-label="Delete" className="hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <div className="p-6 text-center text-slate-500 text-sm">No products found.</div>}
      </div>

      {modal && (
        <ProductForm
          item={modal.item}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}

function ProductForm({ item, categories, onClose, onSaved }) {
  const [f, setF] = useState({
    product_name: item?.product_name || "",
    brand: item?.brand || "",
    category_id: item ? String(item.category_id) : "",
    unit: item?.unit || "",
    image_url: item?.image_url || "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (f.product_name.trim().length < 2) er.product_name = "Name must be at least 2 characters.";
    if (!f.brand.trim()) er.brand = "Brand is required.";
    if (!f.category_id) er.category_id = "Choose a category.";
    if (!f.unit.trim()) er.unit = "Unit is required (e.g. 1 L, 500 g).";
    if (f.image_url.trim() && !/^https?:\/\//.test(f.image_url.trim())) er.image_url = "Must start with http:// or https://";
    setErrors(er);
    if (Object.keys(er).length) return;

    setBusy(true);
    setApiError("");
    const body = {
      product_name: f.product_name.trim(),
      brand: f.brand.trim(),
      category_id: Number(f.category_id),
      unit: f.unit.trim(),
      image_url: f.image_url.trim() || null,
    };
    try {
      if (item) await api.put(`/products/${item.product_id}`, body);
      else await api.post("/products", body);
      onSaved();
    } catch (ex) {
      setApiError(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Modal title={item ? "Edit product" : "Add product"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Product name" error={errors.product_name}>
          <input className={inputClass} value={f.product_name} onChange={set("product_name")} autoFocus />
        </Field>
        <Field label="Brand" error={errors.brand}>
          <input className={inputClass} value={f.brand} onChange={set("brand")} />
        </Field>
        <Field label="Category" error={errors.category_id}>
          <select className={inputClass} value={f.category_id} onChange={set("category_id")}>
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Unit" error={errors.unit}>
          <input className={inputClass} value={f.unit} onChange={set("unit")} placeholder="1 L" />
        </Field>
        <Field label="Image URL (optional)" error={errors.image_url}>
          <input className={inputClass} value={f.image_url} onChange={set("image_url")} placeholder="https://…" />
        </Field>
        {apiError && <div className="text-sm text-red-600">{apiError}</div>}
        <button disabled={busy} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5">
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}