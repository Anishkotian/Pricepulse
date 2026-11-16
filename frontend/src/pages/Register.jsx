import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function validate() {
    if (form.name.trim().length < 2) return "Name must be at least 2 characters.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Enter a valid email address.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return "";
  }

  async function submit(e) {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    setError("");
    setBusy(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const field = (key, label, type = "text", placeholder = "") => (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </label>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white rounded-3xl shadow-lg shadow-brand-900/5 border border-slate-100 p-8">
        <h1 className="text-2xl font-extrabold text-brand-900">Create your account</h1>
        <p className="text-slate-500 mt-1 mb-6 text-sm">Free. Takes less than a minute.</p>

        {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          {field("name", "Full name", "text", "Anish Kotian")}
          {field("email", "Email", "email", "you@example.com")}
          {field("password", "Password", "password", "At least 6 characters")}
          {field("confirm", "Confirm password", "password")}
          <button
            disabled={busy}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5"
          >
            {busy ? "Creating…" : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already registered? <Link to="/login" className="text-brand-700 font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
}