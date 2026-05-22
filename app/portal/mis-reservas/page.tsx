"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, getMyBookings, cancelBooking, type Booking, type UserProfile } from "@/lib/api";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const STATUS_STYLE: Record<string, { bg: string; label: string }> = {
  PENDIENTE:  { bg: "bg-warning text-dark", label: "Pendiente" },
  CONFIRMADO: { bg: "bg-success",           label: "Confirmado" },
  CANCELADO:  { bg: "bg-secondary",         label: "Cancelado" },
};

export default function MisReservasPage() {
  const router = useRouter();
  const [user, setUser]       = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const stored = getCurrentUser();
    if (!stored) { router.replace("/portal"); return; }
    setUser(stored);
    getMyBookings()
      .then(setBookings)
      .catch(() => { logoutUser(); router.replace("/portal"); })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCancel(id: number) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    await cancelBooking(id);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "CANCELADO" } : b));
  }

  function handleLogout() {
    logoutUser();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: "var(--fx-bg)" }}>
        <div className="spinner-border" style={{ color: "var(--fx-accent)" }} />
      </div>
    );
  }

  const active   = bookings.filter((b) => b.status !== "CANCELADO");
  const inactive = bookings.filter((b) => b.status === "CANCELADO");

  return (
    <div className="min-vh-100" style={{ background: "var(--fx-bg)", color: "var(--fx-text)" }}>
      {/* Navbar */}
      <nav className="navbar px-4 py-3 border-bottom border-secondary">
        <a href="/" className="text-decoration-none fw-black" style={{ color: "var(--fx-accent)" }}>
          FORCE EXTREME
        </a>
        <div className="d-flex align-items-center gap-3">
          <span className="small d-none d-sm-inline" style={{ color: "rgba(255,255,255,0.65)" }}>{user?.name}</span>
          <a href="/portal/perfil" className="btn btn-sm btn-fx-outline">
            <i className="bi bi-person-gear me-1" />Perfil
          </a>
          <button className="btn btn-sm btn-outline-secondary" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1" />Salir
          </button>
        </div>
      </nav>

      <div className="container py-5" style={{ maxWidth: 720 }}>
        <h2 className="fw-bold mb-1">Mis reservas</h2>
        <p className="text-muted mb-4">Hola, <strong>{user?.name}</strong>. Aquí están tus clases reservadas.</p>

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
                            {b.classSchedule.startTime} – {b.classSchedule.endTime}
                          </div>
                        )}
                        <div className="mt-1">
                          <span className={`badge ${STATUS_STYLE[b.status]?.bg ?? "bg-secondary"}`}>
                            {STATUS_STYLE[b.status]?.label ?? b.status}
                          </span>
                        </div>
                      </div>
                      {b.status !== "CANCELADO" && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(b.id)}>
                          Cancelar
                        </button>
                      )}
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
                        {b.classSchedule && <span className="text-muted ms-2">{b.classSchedule.startTime}</span>}
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
    </div>
  );
}
