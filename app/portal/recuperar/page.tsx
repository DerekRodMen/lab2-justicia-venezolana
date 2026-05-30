"use client";

import { FormEvent, useState } from "react";
import { forgotPassword } from "@/lib/api";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar el email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center py-5"
      style={{ background: "var(--fx-bg)" }}
    >
      <div
        className="card border-0 p-4"
        style={{ width: "100%", maxWidth: 420, background: "var(--fx-surface)" }}
      >
        {/* Logo */}
        <div className="text-center mb-4">
          <a href="/" className="text-decoration-none">
            <span className="fw-black fs-5" style={{ color: "var(--fx-accent)" }}>
              FORCE EXTREME
            </span>
          </a>
          <p className="text-muted small mb-0 mt-1">Recuperar contraseña</p>
        </div>

        {sent ? (
          /* ── Estado enviado ── */
          <div className="text-center py-3">
            <div className="mb-3" style={{ fontSize: "3rem", color: "#198754" }}>
              <i className="bi bi-envelope-check-fill" />
            </div>
            <h5 className="fw-bold mb-2">Revisa tu email</h5>
            <p className="fx-muted small mb-4">
              Si <strong>{email}</strong> está registrado, recibirás un enlace
              para restablecer tu contraseña en los próximos minutos.
              Revisa también la carpeta de spam.
            </p>
            <a href="/portal" className="btn btn-fx-outline btn-sm">
              <i className="bi bi-arrow-left me-1" />Volver al login
            </a>
          </div>
        ) : (
          /* ── Formulario ── */
          <>
            <p className="fx-muted small mb-4 text-center">
              Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
            </p>

            {error && (
              <div className="alert alert-danger py-2 small mb-3">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label small fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                />
              </div>

              <button
                type="submit"
                className="btn btn-fx w-100 fw-semibold"
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Enviando...</>
                ) : (
                  <><i className="bi bi-send me-2" />Enviar enlace</>
                )}
              </button>
            </form>

            <div className="text-center mt-3">
              <a href="/portal" className="small" style={{ color: "rgba(255,255,255,0.45)" }}>
                <i className="bi bi-arrow-left me-1" />Volver al login
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
