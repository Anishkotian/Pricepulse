import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import api, { errorMessage } from "../../services/api";
import Modal from "../../components/Modal";
import Field, { inputClass } from "../../components/Field";

export default function AdminShops() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  function load() {
    api.get("/shops").then((r) => setItems(r.data)).catch((e) => setError(errorMessage(e)));
  }
  useEffect(load, []);

  async function remove(s) {
    const warn = s.price_count ? ` This also deletes its ${s.price_count} price record(s).` : "";
    if (!window.confirm(`Delete shop "${s.shop_name}"?${warn}`)) return;
    setError("");
    try {
      await api.delete(`/shops/${s.shop_id}`);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-brand-900">Shops</h1>
        <button onClick={() => setModal({ item: null })} className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-full px-4 py-2">
          <Plus size={16} /> Add shop
        </button>
      </div>
      {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="p-4">Shop</th><th>Location</th><th>Contact</th><th>Records</th><th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.shop_id} className="border-b border-slate-50">
                <td className="p-4 font-semibold">{s.shop_name}</td>
                <td>{s.location}</td>
                <td>{s.contact || "—"}</td>
                <td>{s.price_count}</td>
                <td className="flex gap-3 p-4 text-slate-500">
                  <button onClick={() => setModal({ item: s })} aria-label="Edit"><Pencil size={16} /></button>
                  <button onClick={() => remove(s)} aria-label="Delete" className="hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <ShopForm item={modal.item} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}

function ShopForm({ item, onClose, onSaved }) {
  const [f, setF] = useState({
    shop_name: item?.shop_name || "",
    location: item?.location || "",
    contact: item?.contact || "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (f.shop_name.trim().length < 2) er.shop_name = "Shop name must be at least 2 characters.";
    if (f.location.trim().length < 2) er.location = "Location must be at least 2 characters.";
    if (f.contact.trim() && !/^[+\d\s-]{6,20}$/.test(f.contact.trim())) er.contact = "Enter a valid phone number.";
    setErrors(er);
    if (Object.keys(er).length) return;

    setBusy(true);
    setApiError("");
    const body = { shop_name: f.shop_name.trim(), location: f.location.trim(), contact: f.contact.trim() || null };
    try {
      if (item) await api.put(`/shops/${item.shop_id}`, body);
      else await api.post("/shops", body);
      onSaved();
    } catch (ex) {
      setApiError(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Modal title={item ? "Edit shop" : "Add shop"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Shop name" error={errors.shop_name}>
          <input className={inputClass} value={f.shop_name} onChange={set("shop_name")} autoFocus />
        </Field>
        <Field label="Location" error={errors.location}>
          <input className={inputClass} value={f.location} onChange={set("location")} placeholder="Area, City" />
        </Field>
        <Field label="Contact (optional)" error={errors.contact}>
          <input className={inputClass} value={f.contact} onChange={set("contact")} placeholder="+91 90000 00000" />
        </Field>
        {apiError && <div className="text-sm text-red-600">{apiError}</div>}
        <button disabled={busy} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5">
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}