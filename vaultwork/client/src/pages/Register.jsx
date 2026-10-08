import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageWrap from "../components/PageWrap.jsx";
import Guilloche from "../components/Guilloche.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { errMsg } from "../api.js";

const ROLES = [
  { key: "client", title: "I want to hire", body: "Post jobs and pay through escrow" },
  { key: "freelancer", title: "I want to work", body: "Apply to jobs and get paid safely" },
];

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") === "freelancer" ? "freelancer" : "client");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register({ ...form, role });
      navigate("/dashboard");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageWrap className="auth">
      <div className="auth-art" aria-hidden="true">
        <Guilloche size={520} petals={44} />
      </div>
      <form className="slip auth-card" onSubmit={submit}>
        <h1 className="h-display">Create your account</h1>

        <div className="role-pick" role="radiogroup" aria-label="Account type">
          {ROLES.map((r) => (
            <button
              type="button"
              key={r.key}
              role="radio"
              aria-checked={role === r.key}
              className={`role ${role === r.key ? "is-on" : ""}`}
              onClick={() => setRole(r.key)}
            >
              {role === r.key && <motion.span layoutId="role-bg" className="role-bg" />}
              <b>{r.title}</b>
              <small>{r.body}</small>
            </button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" required value={form.name} onChange={set("name")} autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={set("email")} autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" minLength={6} required value={form.password} onChange={set("password")} autoComplete="new-password" />
          <small className="muted">At least 6 characters.</small>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
        <p className="muted">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </PageWrap>
  );
}
