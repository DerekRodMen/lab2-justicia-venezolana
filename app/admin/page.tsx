"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, getAdmin } from "@/lib/api";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getAdmin()) router.replace("/admin/dashboard");
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: "var(--fx-bg)" }}
    >
      <div className="card border-0 shadow-lg p-4" style={{ width: "100%", maxWidth: 400, background: "var(--fx-surface)", backdropFilter: "blur(10px)" }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #ff3b30, #b90000)", boxShadow: "0 10px 30px rgba(255,59,48,0.25)" }}>
            <i className="bi bi-lightning-charge-fill text-white fs-4" />
          </div>
          <div className="fw-black fs-4" style={{ color: "var(--fx-accent)" }}>
            FORCE EXTREME
          </div>
          <p className="text-muted small mb-0 mt-1">
            <i className="bi bi-shield-lock me-1" />Panel de administración
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="alert alert-danger py-2 small mb-3" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-fx w-100 fw-semibold" disabled={loading}>
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Entrando...</>
            ) : "Ingresar"}
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="/" className="small text-decoration-none" style={{ color: "rgba(255,255,255,0.55)" }}>
            <i className="bi bi-arrow-left me-1" />Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
