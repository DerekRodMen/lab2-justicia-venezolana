"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, getCurrentUser } from "@/lib/api";

type Tab = "login" | "register";

export default function PortalPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  useEffect(() => {
    if (getCurrentUser()) router.replace("/portal/mis-reservas");
  }, [router]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await loginUser(loginEmail, loginPassword);
      router.push("/portal/mis-reservas");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally { setLoading(false); }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (regPassword !== regPassword2) { setError("Las contraseñas no coinciden"); return; }
    setError(""); setLoading(true);
    try {
      await registerUser({ name: regName, phone: regPhone, email: regEmail, password: regPassword });
      router.push("/portal/mis-reservas");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5" style={{ background: "var(--fx-bg)" }}>
      <div className="card border-0 shadow-lg p-4" style={{ width: "100%", maxWidth: 420, background: "var(--fx-surface)" }}>
        <div className="text-center mb-4">
          <a href="/" className="text-decoration-none">
            <span className="fw-black fs-5" style={{ color: "var(--fx-accent)" }}>FORCE EXTREME</span>
          </a>
          <p className="text-muted small mb-0 mt-1">Portal de miembros</p>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs border-secondary mb-4">
          {(["login", "register"] as Tab[]).map((t) => (
            <li key={t} className="nav-item flex-fill text-center">
              <button
                className={`nav-link w-100 ${tab === t ? "active" : "text-muted"}`}
                onClick={() => { setTab(t); setError(""); }}
              >
                {t === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            </li>
          ))}
        </ul>

        {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

        {tab === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Email</label>
              <input type="email" className="form-control" required autoFocus
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Contraseña</label>
              <input type="password" className="form-control" required
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-fx w-100 fw-semibold" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Entrando...</> : "Ingresar"}
            </button>
            <div className="text-center mt-3">
              <a href="/portal/recuperar" className="small" style={{ color: "rgba(255,255,255,0.45)" }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Nombre completo</label>
              <input type="text" className="form-control" required
                value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Tu nombre" />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">WhatsApp</label>
              <input type="tel" className="form-control" required
                value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="6030-1104" />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Email</label>
              <input type="email" className="form-control" required
                value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-semibold">Contraseña</label>
                <input type="password" className="form-control" required minLength={6}
                  value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Confirmar</label>
                <input type="password" className="form-control" required minLength={6}
                  value={regPassword2} onChange={(e) => setRegPassword2(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-fx w-100 fw-semibold" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creando cuenta...</> : "Crear cuenta"}
            </button>
          </form>
        )}

        <p className="text-center small text-muted mt-3 mb-0">
          <a href="/" className="text-muted">← Volver al sitio</a>
        </p>
      </div>
    </div>
  );
}
