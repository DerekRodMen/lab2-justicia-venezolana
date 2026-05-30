"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser, logoutUser,
  getMyBookings, cancelBooking, transferBooking,
  getMyMembership, createReview,
  getClasses,
  type Booking, type UserProfile, type Membership, type ClassSchedule,
} from "@/lib/api";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const PLAN_STYLE: Record<string, { label: string; color: string; icon: string }> = {
  BASICO:   { label: "Plan Básico",   color: "#6c757d", icon: "bi-award" },
  PRO:      { label: "Plan Pro",      color: "var(--fx-accent)", icon: "bi-award-fill" },
  PREMIUM:  { label: "Plan Premium",  color: "#ffd700", icon: "bi-gem" },
};

const STATUS_STYLE: Record<string, { bg: string; label: string }> = {
  PENDIENTE:  { bg: "bg-warning text-dark", label: "Pendiente" },
  CONFIRMADO: { bg: "bg-success",           label: "Confirmado" },
  CANCELADO:  { bg: "bg-secondary",         label: "Cancelado" },
};

export default function MisReservasPage() {
  const router = useRouter();
  const [user,       setUser]       = useState<UserProfile | null>(null);
  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [allClasses, setAllClasses] = useState<ClassSchedule[]>([]);
  const [loading,    setLoading]    = useState(true);

  // — Transfer modal
  const [transferBookingTarget, setTransferTarget] = useState<Booking | null>(null);
  const [transferClassId,       setTransferClassId] = useState<number | "">("");
  const [transferSaving,        setTransferSaving]  = useState(false);
  const [transferError,         setTransferError]   = useState("");

  // — Review modal
  const [reviewBooking,  setReviewBooking]  = useState<Booking | null>(null);
  const [reviewRating,   setReviewRating]   = useState(5);
  const [reviewComment,  setReviewComment]  = useState("");
  const [reviewSaving,   setReviewSaving]   = useState(false);
  const [reviewedIds,    setReviewedIds]    = useState<Set<number>>(new Set());

  useEffect(() => {
    const stored = getCurrentUser();
    if (!stored) { router.replace("/portal"); return; }
    setUser(stored);

    Promise.all([getMyBookings(), getMyMembership(), getClasses()])
      .then(([bks, mem, cls]) => {
        setBookings(bks);
        setMembership(mem);
        setAllClasses(cls);
      })
      .catch(() => { logoutUser(); router.replace("/portal"); })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCancel(id: number) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    await cancelBooking(id);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "CANCELADO" } : b));
  }

  async function handleTransfer(e: FormEvent) {
    e.preventDefault();
    if (!transferBookingTarget || !transferClassId) return;
    setTransferError(""); setTransferSaving(true);
    try {
      const updated = await transferBooking(transferBookingTarget.id, Number(transferClassId));
      setBookings((prev) => prev.map((b) => b.id === updated.id ? updated : b));
      setTransferTarget(null);
      setTransferClassId("");
    } catch (err: unknown) {
      setTransferError(err instanceof Error ? err.message : "No se pudo cambiar la clase");
    } finally { setTransferSaving(false); }
  }

  async function handleReviewSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reviewBooking) return;
    setReviewSaving(true);
    try {
      await createReview({ bookingId: reviewBooking.id, rating: reviewRating, comment: reviewComment || undefined });
      setReviewedIds((prev) => new Set(prev).add(reviewBooking.id));
      setReviewBooking(null);
      setReviewComment("");
      setReviewRating(5);
    } catch { /* ignore */ }
    finally { setReviewSaving(false); }
  }

  const daysLeft = membership
    ? Math.max(0, Math.ceil((new Date(membership.endDate).getTime() - Date.now()) / 86_400_000))
    : 0;

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: "var(--fx-bg)" }}>
        <div className="spinner-border" style={{ color: "var(--fx-accent)" }} />
      </div>
    );
  }

  const active   = bookings.filter((b) => b.status !== "CANCELADO");
  const inactive = bookings.filter((b) => b.status === "CANCELADO");
  const canReview = (b: Booking) =>
    (b.status === "CONFIRMADO" || b.attended) && !reviewedIds.has(b.id);

  return (
    <div className="min-vh-100" style={{ background: "var(--fx-bg)", color: "var(--fx-text)" }}>
      {/* Navbar */}
      <nav className="navbar px-4 py-3 border-bottom border-secondary">
        <a href="/" className="text-decoration-none fw-black" style={{ color: "var(--fx-accent)" }}>
          FORCE EXTREME
        </a>
        <div className="d-flex align-items-center gap-3">
          <span className="small d-none d-sm-inline" style={{ color: "rgba(255,255,255,0.65)" }}>{user?.name}</span>
          <a href="/portal/progreso" className="btn btn-sm btn-fx-outline d-none d-sm-inline-flex">
            <i className="bi bi-graph-up me-1" />Progreso
          </a>
          <a href="/portal/perfil" className="btn btn-sm btn-fx-outline">
            <i className="bi bi-person-gear me-1" />Perfil
          </a>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { logoutUser(); router.push("/"); }}>
            <i className="bi bi-box-arrow-right me-1" />Salir
          </button>
        </div>
      </nav>

      <div className="container py-5" style={{ maxWidth: 720 }}>
        <h2 className="fw-bold mb-1">Mis reservas</h2>
        <p className="text-muted mb-4">Hola, <strong>{user?.name}</strong>. Aquí están tus clases y tu plan activo.</p>

        {/* ── Membresía ── */}
        {membership && membership.isActive ? (
          <div className="fx-surface p-4 mb-4 d-flex align-items-center gap-3 flex-wrap">
            <div className="icon-bubble" style={{ width: 48, height: 48, background: "rgba(255,59,48,0.12)", border: "1px solid rgba(255,59,48,0.3)" }}>
              <i className={`bi ${PLAN_STYLE[membership.plan]?.icon ?? "bi-award"}`}
                style={{ color: PLAN_STYLE[membership.plan]?.color ?? "var(--fx-accent)" }} />
            </div>
            <div className="flex-grow-1">
              <div className="fw-bold">{PLAN_STYLE[membership.plan]?.label ?? membership.plan}</div>
              <div className="small text-muted">
                Vence el {new Date(membership.endDate).toLocaleDateString("es-CR")}
                {" · "}
                <span style={{ color: daysLeft <= 7 ? "#ff8a80" : "rgba(255,255,255,0.6)" }}>
                  {daysLeft === 0 ? "Vence hoy" : `${daysLeft} día${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`}
                </span>
              </div>
            </div>
            {daysLeft <= 7 && (
              <span className="badge" style={{ background: "rgba(255,59,48,0.18)", color: "var(--fx-accent)" }}>
                <i className="bi bi-exclamation-circle me-1" />Renueva pronto
              </span>
            )}
          </div>
        ) : (
          <div className="fx-surface p-3 mb-4 d-flex align-items-center gap-3"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <i className="bi bi-shield-x text-muted fs-5" />
            <div className="small text-muted">Sin plan activo.{" "}
              <a href="/#promos" style={{ color: "var(--fx-accent)" }}>Ver planes →</a>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-calendar-x" style={{ fontSize: "3rem", color: "var(--fx-muted)" }} />
            <p className="mt-3 text-muted">No tienes reservas todavía.</p>
            <a href="/#horarios" className="btn btn-fx fw-semibold">
              <i className="bi bi-calendar-check me-2" />Reservar una clase
            </a>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="mb-5">
                <h5 className="fw-semibold mb-3">
                  <i className="bi bi-calendar-check me-2" style={{ color: "var(--fx-accent)" }} />
                  Próximas clases ({active.length})
                </h5>
                <div className="d-flex flex-column gap-3">
                  {active.map((b) => (
                    <div key={b.id} className="fx-surface p-4 d-flex align-items-center gap-3 flex-wrap">
                      <div className="icon-bubble" style={{ width: 44, height: 44, fontSize: "1rem", flexShrink: 0 }}>
                        <i className="bi bi-dumbbell" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold">{b.classSchedule?.name ?? `Clase #${b.classScheduleId}`}</div>
                        {b.classSchedule && (
                          <div className="small text-muted">
                            <i className="bi bi-clock me-1" />
                            {DAYS[b.classSchedule.dayOfWeek]} · {b.classSchedule.startTime} – {b.classSchedule.endTime}
                          </div>
                        )}
                        <div className="mt-1 d-flex gap-2 flex-wrap align-items-center">
                          <span className={`badge ${STATUS_STYLE[b.status]?.bg ?? "bg-secondary"}`}>
                            {STATUS_STYLE[b.status]?.label ?? b.status}
                          </span>
                          {b.attended === true && <span className="badge bg-primary">Asististe ✓</span>}
                          {b.attended === false && <span className="badge bg-secondary">No asististe</span>}
                        </div>
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        {canReview(b) && !reviewedIds.has(b.id) && (
                          <button
                            className="btn btn-sm btn-fx-outline"
                            onClick={() => { setReviewBooking(b); setReviewRating(5); setReviewComment(""); }}
                          >
                            <i className="bi bi-star me-1" />Evaluar
                          </button>
                        )}
                        {reviewedIds.has(b.id) && (
                          <span className="badge bg-success align-self-center">
                            <i className="bi bi-star-fill me-1" />Evaluada
                          </span>
                        )}
                        {b.status !== "CANCELADO" && (
                          <button className="btn btn-sm btn-fx-outline"
                            onClick={() => { setTransferTarget(b); setTransferClassId(""); setTransferError(""); }}
                            title="Cambiar a otra clase">
                            <i className="bi bi-arrow-left-right me-1" />Cambiar
                          </button>
                        )}
                        {b.status !== "CANCELADO" && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(b.id)}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inactive.length > 0 && (
              <div>
                <h6 className="text-muted fw-semibold mb-3">Historial cancelado</h6>
                <div className="d-flex flex-column gap-2">
                  {inactive.map((b) => (
                    <div key={b.id} className="fx-surface p-3 d-flex align-items-center gap-3 opacity-50">
                      <i className="bi bi-x-circle text-danger" />
                      <div className="small">
                        <span className="fw-semibold">{b.classSchedule?.name ?? `Clase #${b.classScheduleId}`}</span>
                        {b.classSchedule && (
                          <span className="text-muted ms-2">
                            {DAYS[b.classSchedule.dayOfWeek]} · {b.classSchedule.startTime}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center mt-5">
              <a href="/#horarios" className="btn btn-fx-outline">
                <i className="bi bi-plus-lg me-2" />Reservar otra clase
              </a>
            </div>
          </>
        )}
      </div>

      {/* ── Modal cambio de clase ── */}
      {transferBookingTarget && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !transferSaving && setTransferTarget(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0" style={{ background: "var(--fx-surface)", backdropFilter: "blur(16px)" }}>
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title fw-bold mb-0">Cambiar clase</h5>
                  <p className="small fx-muted mb-0">
                    Actualmente: <strong>{transferBookingTarget.classSchedule?.name ?? `Clase #${transferBookingTarget.classScheduleId}`}</strong>
                    {transferBookingTarget.classSchedule && ` · ${DAYS[transferBookingTarget.classSchedule.dayOfWeek]} ${transferBookingTarget.classSchedule.startTime}`}
                  </p>
                </div>
                {!transferSaving && <button className="btn-close btn-close-white" onClick={() => setTransferTarget(null)} />}
              </div>
              <form onSubmit={handleTransfer}>
                <div className="modal-body">
                  {transferError && <div className="alert alert-danger py-2 small mb-3">{transferError}</div>}
                  <label className="form-label small fw-semibold">Selecciona la nueva clase</label>
                  <select className="form-select" required value={transferClassId}
                    onChange={(e) => setTransferClassId(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">— Elige una clase —</option>
                    {allClasses
                      .filter((c) => c.id !== transferBookingTarget.classScheduleId && c.isActive)
                      .map((c) => {
                        const spots = c.capacity - c._count.bookings;
                        return (
                          <option key={c.id} value={c.id} disabled={spots <= 0}>
                            {c.name} · {DAYS[c.dayOfWeek]} {c.startTime}
                            {spots <= 0 ? " — Sin cupos" : ` (${spots} cupos)`}
                          </option>
                        );
                      })}
                  </select>
                  <p className="small text-muted mt-2 mb-0">
                    <i className="bi bi-info-circle me-1" />
                    Tu reserva pasará a estado Pendiente en la nueva clase.
                  </p>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-outline-secondary btn-sm"
                    disabled={transferSaving} onClick={() => setTransferTarget(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-fx btn-sm fw-semibold"
                    disabled={transferSaving || !transferClassId}>
                    {transferSaving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Cambiando...</>
                      : <><i className="bi bi-arrow-left-right me-2" />Confirmar cambio</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal evaluación ── */}
      {reviewBooking && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !reviewSaving && setReviewBooking(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0" style={{ background: "var(--fx-surface)", backdropFilter: "blur(16px)" }}>
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title fw-bold mb-0">Evaluar clase</h5>
                  <p className="small fx-muted mb-0">
                    {reviewBooking.classSchedule?.name ?? `Clase #${reviewBooking.classScheduleId}`}
                  </p>
                </div>
                {!reviewSaving && <button className="btn-close btn-close-white" onClick={() => setReviewBooking(null)} />}
              </div>
              <form onSubmit={handleReviewSubmit}>
                <div className="modal-body">
                  {/* Estrellas */}
                  <div className="text-center mb-4">
                    <p className="small fw-semibold mb-2">¿Cómo fue la clase?</p>
                    <div className="d-flex gap-2 justify-content-center fs-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button"
                          onClick={() => setReviewRating(star)}
                          style={{ background: "none", border: "none", cursor: "pointer",
                            color: star <= reviewRating ? "#ffc107" : "rgba(255,255,255,0.2)",
                            transition: "color 0.1s" }}>
                          <i className="bi bi-star-fill" />
                        </button>
                      ))}
                    </div>
                    <p className="small text-muted mt-1">
                      {["", "Muy mala", "Mala", "Regular", "Buena", "Excelente"][reviewRating]}
                    </p>
                  </div>
                  <div>
                    <label className="form-label small fw-semibold">Comentario <span className="text-muted">(opcional)</span></label>
                    <textarea className="form-control" rows={3}
                      placeholder="¿Qué te gustó? ¿Qué mejorarías?"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)} />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-outline-secondary btn-sm"
                    disabled={reviewSaving} onClick={() => setReviewBooking(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-fx btn-sm fw-semibold" disabled={reviewSaving}>
                    {reviewSaving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Enviando...</>
                      : <><i className="bi bi-send me-2" />Enviar evaluación</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
