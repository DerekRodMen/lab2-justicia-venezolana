"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api";

function NuevaContrasenaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Enlace inválido o expirado. Solicita uno nuevo.");
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      // Redirige al login después de 2 segundos.
      setTimeout(() => router.push("/portal"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo restablecer la contraseña.");
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
          <p className="text-muted small mb-0 mt-1">Nueva contraseña</p>
        </div>

        {done ? (
          /* ── Éxito ── */
          <div className="text-center py-3">
            <div className="mb-3" style={{ fontSize: "3rem", color: "#198754" }}>
              <i className="bi bi-check-circle-fill" />
            </div>
            <h5 className="fw-bold mb-2">¡Contraseña actualizada!</h5>
            <p className="fx-muted small">
              Redirigiendo al login...
            </p>
            <div className="spinner-border spinner-border-sm mt-2" style={{ color: "var(--fx-accent)" }} />
          </div>
        ) : (
          /* ── Formulario ── */
          <>
            <p className="fx-muted small mb-4 text-center">
              Elige una contraseña nueva de al menos 6 caracteres.
            </p>

            {error && (
              <div className="alert alert-danger py-2 small mb-3">
                {error}
                {!token && (
                  <div className="mt-2">
                    <a href="/portal/recuperar" style={{ color: "#ff8a80" }}>
                      Solicitar nuevo enlace →
                    </a>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Nueva contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  minLength={6}
                  autoFocus
                  disabled={!token}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-semibold">Confirmar contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  minLength={6}
                  disabled={!token}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-fx w-100 fw-semibold"
                disabled={loading || !token}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                ) : (
                  <><i className="bi bi-shield-lock me-2" />Guardar nueva contraseña</>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function NuevaContrasenaPage() {
  return (
    <Suspense>
      <NuevaContrasenaForm />
    </Suspense>
  );
}
