import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import api, { errorMessage } from "../../services/api";
import Modal from "../../components/Modal";
import Field, { inputClass } from "../../components/Field";

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | { item: category | null }

  function load() {
    api.get("/categories").then((r) => setItems(r.data)).catch((e) => setError(errorMessage(e)));
  }
  useEffect(load, []);

  async function remove(c) {
    if (!window.confirm(`Delete category "${c.category_name}"?`)) return;
    setError("");
    try {
      await api.delete(`/categories/${c.category_id}`);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-brand-900">Categories</h1>
        <button onClick={() => setModal({ item: null })} className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-full px-4 py-2">
          <Plus size={16} /> Add category
        </button>
      </div>
      {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="p-4">Name</th><th>Products</th><th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.category_id} className="border-b border-slate-50">
                <td className="p-4 font-semibold">{c.category_name}</td>
                <td>{c.product_count}</td>
                <td className="flex gap-3 p-4 text-slate-500">
                  <button onClick={() => setModal({ item: c })} aria-label="Edit"><Pencil size={16} /></button>
                  <button onClick={() => remove(c)} aria-label="Delete" className="hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <CategoryForm
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CategoryForm({ item, onClose, onSaved }) {
  const [name, setName] = useState(item?.category_name || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2) return setErr("Name must be at least 2 characters.");
    setBusy(true);
    setErr("");
    try {
      if (item) await api.put(`/categories/${item.category_id}`, { category_name: n });
      else await api.post("/categories", { category_name: n });
      onSaved();
    } catch (ex) {
      setErr(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={item ? "Edit category" : "Add category"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Category name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button disabled={busy} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5">
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}