"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, updateUserProfile, type UserProfile } from "@/lib/api";

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = getCurrentUser();
    if (!stored) { router.replace("/portal"); return; }
    setUser(stored);
    setName(stored.name);
    setPhone(stored.phone);
    setEmail(stored.email);
  }, [router]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (password && password !== password2) { setError("Las contraseñas no coinciden"); return; }
    setError(""); setSaving(true); setSuccess(false);
    try {
      const updated = await updateUserProfile({
        name:    name    !== user?.name    ? name    : undefined,
        phone:   phone   !== user?.phone   ? phone   : undefined,
        email:   email   !== user?.email   ? email   : undefined,
        password: password || undefined,
      });
      // Sync localStorage
      localStorage.setItem("fx_user", JSON.stringify(updated));
      setUser(updated);
      setPassword(""); setPassword2("");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-vh-100" style={{ background: "var(--fx-bg)", color: "var(--fx-text)" }}>
      {/* Navbar */}
      <nav className="navbar px-4 py-3 border-bottom border-secondary">
        <a href="/" className="text-decoration-none fw-black" style={{ color: "var(--fx-accent)" }}>FORCE EXTREME</a>
        <div className="d-flex align-items-center gap-3">
          <a href="/portal/mis-reservas" className="btn btn-sm btn-fx-outline">
            <i className="bi bi-calendar-check me-1" />Mis reservas
          </a>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { logoutUser(); router.push("/"); }}>
            <i className="bi bi-box-arrow-right me-1" />Salir
          </button>
        </div>
      </nav>

      <div className="container py-5" style={{ maxWidth: 560 }}>
        <h2 className="fw-bold mb-1">Mi perfil</h2>
        <p className="mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>Actualiza tus datos de contacto o cambia tu contraseña.</p>

        <div className="fx-surface p-4">
          {success && (
            <div className="alert alert-success py-2 small mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill" />
              Perfil actualizado correctamente.
            </div>
          )}
          {error && <div className="alert alert-danger py-2 small mb-4">{error}</div>}

          <form onSubmit={handleSave}>
            <div className="row g-3 mb-3">
              <div className="col-12">
                <label className="form-label small fw-semibold">Nombre completo</label>
                <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">WhatsApp</label>
                <input className="form-control" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Email</label>
                <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "1.25rem 0" }} />

            <p className="small fw-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
              <i className="bi bi-shield-lock me-1" />Cambiar contraseña <span style={{ fontWeight: 400 }}>(dejar en blanco para no cambiarla)</span>
            </p>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Nueva contraseña</label>
                <input className="form-control" type="password" minLength={6} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Confirmar</label>
                <input className="form-control" type="password" minLength={6} value={password2}
                  onChange={(e) => setPassword2(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-fx w-100 fw-semibold" disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                : <><i className="bi bi-floppy me-2" />Guardar cambios</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
