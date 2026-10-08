import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import PageWrap from "../components/PageWrap.jsx";
import Guilloche from "../components/Guilloche.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { errMsg } from "../api.js";

const DEMO = [
  { label: "Client", email: "client@vaultwork.com", password: "client123" },
  { label: "Freelancer", email: "freelancer@vaultwork.com", password: "free123" },
  { label: "Admin", email: "admin@vaultwork.com", password: "admin123" },
];

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
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
        <h1 className="h-display">Sign in</h1>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <div className="demo-logins">
          <span className="muted">Demo accounts (created by the seed script)</span>
          <div>
            {DEMO.map((d) => (
              <button
                type="button"
                key={d.label}
                className="chip"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <p className="muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </PageWrap>
  );
}
