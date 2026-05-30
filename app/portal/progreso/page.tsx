"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser, logoutUser,
  getProgress, addProgress, deleteProgress,
  type ProgressEntry,
} from "@/lib/api";

const CATEGORIES = [
  { value: "FUERZA",  label: "Fuerza",   icon: "bi-barbell",        color: "#ff3b30" },
  { value: "CARDIO",  label: "Cardio",   icon: "bi-heart-pulse",    color: "#0dcaf0" },
  { value: "PESO",    label: "Peso",     icon: "bi-speedometer2",   color: "#ffc107" },
  { value: "GENERAL", label: "General",  icon: "bi-activity",       color: "#198754" },
] as const;

type Cat = typeof CATEGORIES[number]["value"];

export default function ProgresoPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [activeTab, setActiveTab] = useState<Cat | "ALL">("ALL");

  // Form
  const today = new Date().toISOString().slice(0, 10);
  const [cat,     setCat]     = useState<Cat>("GENERAL");
  const [date,    setDate]    = useState(today);
  const [weight,  setWeight]  = useState("");
  const [reps,    setReps]    = useState("");
  const [notes,   setNotes]   = useState("");

  useEffect(() => {
    if (!getCurrentUser()) { router.replace("/portal"); return; }
    getProgress()
      .then(setEntries)
      .catch(() => { logoutUser(); router.replace("/portal"); })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const entry = await addProgress({
        category: cat,
        date,
        weight:  weight ? Number(weight) : undefined,
        reps:    reps   ? Number(reps)   : undefined,
        notes:   notes  || undefined,
      });
      setEntries((prev) => [entry, ...prev]);
      setWeight(""); setReps(""); setNotes(""); setDate(today);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await deleteProgress(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch { setError("Error al eliminar"); }
  }

  const visible = activeTab === "ALL"
    ? entries
    : entries.filter((e) => e.category === activeTab);

  const catInfo = (c: Cat) => CATEGORIES.find((x) => x.value === c)!;

  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: "var(--fx-bg)" }}>
      <div className="spinner-border" style={{ color: "var(--fx-accent)" }} />
    </div>
  );

  return (
    <div className="min-vh-100" style={{ background: "var(--fx-bg)", color: "var(--fx-text)" }}>
      {/* Navbar */}
      <nav className="navbar px-4 py-3 border-bottom border-secondary">
        <a href="/" className="text-decoration-none fw-black" style={{ color: "var(--fx-accent)" }}>
          FORCE EXTREME
        </a>
        <div className="d-flex gap-2">
          <a href="/portal/mis-reservas" className="btn btn-sm btn-fx-outline">
            <i className="bi bi-calendar-check me-1" />Reservas
          </a>
          <a href="/portal/perfil" className="btn btn-sm btn-fx-outline">
            <i className="bi bi-person-gear me-1" />Perfil
          </a>
          <button className="btn btn-sm btn-outline-secondary"
            onClick={() => { logoutUser(); router.push("/"); }}>
            <i className="bi bi-box-arrow-right me-1" />Salir
          </button>
        </div>
      </nav>

      <div className="container py-5" style={{ maxWidth: 780 }}>
        <h2 className="fw-bold mb-1">Mi progreso</h2>
        <p className="text-muted mb-4">Registra tu avance semana a semana — peso, repeticiones, notas.</p>

        {/* ── Resumen rápido ── */}
        {entries.length > 0 && (
          <div className="row g-3 mb-5">
            {CATEGORIES.map((c) => {
              const group = entries.filter((e) => e.category === c.value);
              if (group.length === 0) return null;
              const latest = group[0];
              return (
                <div key={c.value} className="col-6 col-lg-3">
                  <div className="fx-surface p-3 text-center">
                    <i className={`bi ${c.icon} fs-4 mb-1`} style={{ color: c.color }} />
                    <div className="fw-bold small">{c.label}</div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {group.length} registro{group.length !== 1 ? "s" : ""}
                    </div>
                    {latest.weight != null && (
                      <div className="fw-bold mt-1" style={{ color: c.color }}>
                        {latest.weight} kg
                      </div>
                    )}
                    {latest.reps != null && (
                      <div className="fw-bold mt-1" style={{ color: c.color }}>
                        {latest.reps} reps
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Formulario ── */}
        <div className="fx-surface p-4 mb-4">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-plus-circle me-2" style={{ color: "var(--fx-accent)" }} />
            Agregar registro
          </h5>
          {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}
          <form onSubmit={handleAdd}>
            <div className="row g-3 mb-3">
              <div className="col-sm-6">
                <label className="form-label small fw-semibold">Categoría</label>
                <select className="form-select" value={cat} onChange={(e) => setCat(e.target.value as Cat)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-semibold">Fecha</label>
                <input type="date" className="form-control" value={date}
                  onChange={(e) => setDate(e.target.value)} max={today} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-semibold">
                  Peso <span className="text-muted">(kg, opcional)</span>
                </label>
                <input type="number" step="0.1" min="0" className="form-control"
                  placeholder="Ej: 72.5" value={weight}
                  onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-semibold">
                  Repeticiones <span className="text-muted">(opcional)</span>
                </label>
                <input type="number" min="0" className="form-control"
                  placeholder="Ej: 12" value={reps}
                  onChange={(e) => setReps(e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">
                  Notas <span className="text-muted">(opcional)</span>
                </label>
                <textarea className="form-control" rows={2}
                  placeholder="Ej: Hoy aumenté el peso en sentadilla, me sentí bien..."
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-fx fw-semibold" disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                : <><i className="bi bi-floppy me-2" />Guardar registro</>
              }
            </button>
          </form>
        </div>

        {/* ── Historial ── */}
        <div>
          <div className="d-flex gap-2 flex-wrap mb-3">
            {(["ALL", ...CATEGORIES.map((c) => c.value)] as (Cat | "ALL")[]).map((t) => (
              <button key={t} className={`btn btn-sm ${activeTab === t ? "btn-fx" : "btn-fx-outline"}`}
                onClick={() => setActiveTab(t)}>
                {t === "ALL" ? "Todos" : CATEGORIES.find((c) => c.value === t)!.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-graph-up" style={{ fontSize: "3rem", color: "var(--fx-muted)" }} />
              <p className="mt-3 text-muted">Aún no tienes registros. ¡Empieza hoy!</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {visible.map((entry) => {
                const info = catInfo(entry.category);
                return (
                  <div key={entry.id} className="fx-surface p-3 d-flex align-items-start gap-3">
                    <div className="icon-bubble flex-shrink-0"
                      style={{ width: 40, height: 40, background: `${info.color}18`, border: `1px solid ${info.color}40` }}>
                      <i className={`bi ${info.icon} small`} style={{ color: info.color }} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-semibold small">{info.label}</span>
                        <span className="text-muted small">
                          {new Date(entry.date).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        {entry.weight != null && (
                          <span className="badge" style={{ background: `${info.color}20`, color: info.color }}>
                            {entry.weight} kg
                          </span>
                        )}
                        {entry.reps != null && (
                          <span className="badge" style={{ background: "rgba(255,255,255,0.08)", color: "var(--fx-text)" }}>
                            {entry.reps} reps
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="mb-0 mt-1 small text-muted" style={{ lineHeight: 1.5 }}>
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <button className="btn btn-sm btn-outline-danger flex-shrink-0"
                      onClick={() => handleDelete(entry.id)} title="Eliminar">
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
