"use client";

import { useEffect, useState, FormEvent } from "react";
import { getClasses, createBooking, joinWaitlist, getCurrentUser, getMyBookings, type ClassSchedule } from "@/lib/api";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const CLASS_ICONS: Record<string, string> = {
  Fuerza: "bi-barbell",
  HIIT: "bi-lightning-charge-fill",
  Funcional: "bi-bounding-box-circles",
  Iniciación: "bi-emoji-smile",
};

type BookingForm = { name: string; phone: string; email: string };
type ModalMode = "booking" | "waitlist";

export default function ClassScheduleSection() {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [form, setForm] = useState<BookingForm>({ name: "", phone: "", email: "" });
  const [bookingStatus, setBookingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [modalMode, setModalMode] = useState<ModalMode>("booking");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [loggedUser, setLoggedUser] = useState<{ name: string; phone: string; email: string } | null>(null);
  const [bookedClassIds, setBookedClassIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      setLoggedUser({ name: u.name, phone: u.phone, email: u.email });
      getMyBookings()
        .then((bks) => {
          const ids = new Set(bks.filter((b) => b.status !== "CANCELADO").map((b) => b.classScheduleId));
          setBookedClassIds(ids);
        })
        .catch(() => {});
    }

    getClasses()
      .then((data) => {
        setClasses(data);
        if (data.length > 0) setActiveDay(data[0].dayOfWeek);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const days = [...new Set(classes.map((c) => c.dayOfWeek))].sort();
  const visibleClasses = activeDay !== null
    ? classes.filter((c) => c.dayOfWeek === activeDay)
    : classes;

  function openBooking(cls: ClassSchedule) {
    setSelectedClass(cls);
    setModalMode("booking");
    setForm(loggedUser ?? { name: "", phone: "", email: "" });
    setBookingStatus("idle");
    setErrorMsg("");
  }

  function openWaitlist(cls: ClassSchedule) {
    setSelectedClass(cls);
    setModalMode("waitlist");
    setForm(loggedUser ?? { name: "", phone: "", email: "" });
    setBookingStatus("idle");
    setErrorMsg("");
  }

  async function handleBooking(e: FormEvent) {
    e.preventDefault();
    if (!selectedClass) return;
    setBookingStatus("loading");
    setErrorMsg("");
    try {
      if (modalMode === "waitlist") {
        await joinWaitlist({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          classScheduleId: selectedClass.id,
        });
      } else {
        await createBooking({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          classScheduleId: selectedClass.id,
        });
      }
      setBookingStatus("success");
    } catch (err: unknown) {
      setBookingStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "No se pudo completar la operación");
    }
  }

  const spotsLeft = (cls: ClassSchedule) => cls.capacity - cls._count.bookings;

  if (loading) {
    return (
      <div className="row g-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="col-sm-6 col-lg-4">
            <div className="fx-surface p-4 h-100" style={{ minHeight: 200 }}>
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="skeleton-pulse rounded-circle" style={{ width: 40, height: 40 }} />
                <div className="skeleton-pulse rounded-pill" style={{ width: 72, height: 22 }} />
              </div>
              <div className="skeleton-pulse rounded mb-2" style={{ width: "60%", height: 20 }} />
              <div className="skeleton-pulse rounded mb-3" style={{ width: "45%", height: 14 }} />
              <div className="d-flex gap-3 mb-4">
                <div className="skeleton-pulse rounded" style={{ width: 50, height: 14 }} />
                <div className="skeleton-pulse rounded" style={{ width: 90, height: 14 }} />
              </div>
              <div className="skeleton-pulse rounded mt-auto" style={{ width: "100%", height: 38 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (classes.length === 0) return null;

  return (
    <>
      {/* Day filter tabs */}
      <div className="d-flex gap-2 flex-wrap mb-4">
        {days.map((d) => (
          <button
            key={d}
            className={`btn btn-sm ${activeDay === d ? "btn-fx" : "btn-fx-outline"}`}
            onClick={() => setActiveDay(d)}
          >
            {DAYS[d]}
          </button>
        ))}
      </div>

      {/* Class cards */}
      <div className="row g-3">
        {visibleClasses.map((cls) => {
          const left = spotsLeft(cls);
          const full = left <= 0;
          const alreadyBooked = bookedClassIds.has(cls.id);
          return (
            <div key={cls.id} className="col-sm-6 col-lg-4">
              <div className="fx-surface p-4 h-100 d-flex flex-column">
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div className="icon-bubble" style={{ width: 40, height: 40, fontSize: "1rem" }}>
                    <i className={`bi ${CLASS_ICONS[cls.name] ?? "bi-activity"}`}></i>
                  </div>
                  <span
                    className="small fw-semibold px-2 py-1 rounded-pill"
                    style={{
                      background: alreadyBooked
                        ? "rgba(13,110,253,0.15)"
                        : full ? "rgba(220,53,69,0.15)" : "rgba(25,135,84,0.15)",
                      color: alreadyBooked ? "#6ea8fe" : full ? "#dc3545" : "#198754",
                    }}
                  >
                    {alreadyBooked ? "Ya reservado" : full ? "Lleno" : `${left} cupos`}
                  </span>
                </div>

                <h5 className="fw-bold mb-1">{cls.name}</h5>
                <p className="small fx-muted mb-3">
                  <i className="bi bi-person me-1" />{cls.instructor}
                </p>

                <div className="d-flex gap-3 small fx-muted mb-4">
                  <span><i className="bi bi-calendar3 me-1" />{DAY_SHORT[cls.dayOfWeek]}</span>
                  <span><i className="bi bi-clock me-1" />{cls.startTime} – {cls.endTime}</span>
                </div>

                <div className="mt-auto d-flex flex-column gap-2">
                  {alreadyBooked ? (
                    <a href="/portal/mis-reservas" className="btn btn-fx-outline w-100 fw-semibold">
                      <i className="bi bi-check-circle me-2" />Ver mi reserva
                    </a>
                  ) : full ? (
                    <button
                      className="btn btn-fx-outline w-100 fw-semibold"
                      onClick={() => openWaitlist(cls)}
                    >
                      <i className="bi bi-hourglass-split me-2" />Lista de espera
                    </button>
                  ) : (
                    <button
                      className="btn btn-fx w-100 fw-semibold"
                      onClick={() => openBooking(cls)}
                    >
                      <i className="bi bi-calendar-check me-2" />Reservar lugar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking modal */}
      {selectedClass && (
        <div
          className="modal show d-block"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => bookingStatus !== "loading" && setSelectedClass(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0" style={{ background: "var(--fx-surface)", backdropFilter: "blur(16px)" }}>
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title fw-bold mb-0">
                    {modalMode === "waitlist" ? "Lista de espera — " : ""}{selectedClass.name}
                  </h5>
                  <p className="small fx-muted mb-0">
                    {DAYS[selectedClass.dayOfWeek]} · {selectedClass.startTime} – {selectedClass.endTime} · {selectedClass.instructor}
                  </p>
                </div>
                {bookingStatus !== "loading" && (
                  <button className="btn-close btn-close-white" onClick={() => setSelectedClass(null)} />
                )}
              </div>

              <div className="modal-body">
                {bookingStatus === "success" ? (
                  <div className="text-center py-3">
                    <i
                      className={`bi ${modalMode === "waitlist" ? "bi-hourglass-split text-warning" : "bi-check-circle-fill text-success"}`}
                      style={{ fontSize: "3rem" }}
                    />
                    {modalMode === "waitlist" ? (
                      <>
                        <h5 className="fw-bold mt-3 mb-2">¡Anotado en lista de espera!</h5>
                        <p className="fx-muted mb-3">
                          Te avisaremos por email si se libera un cupo en{" "}
                          <strong>{selectedClass.name}</strong>.
                          {!form.email && (
                            <span className="d-block mt-2 small" style={{ color: "var(--fx-accent)" }}>
                              <i className="bi bi-info-circle me-1" />
                              Agrega tu email la próxima vez para recibir el aviso automáticamente.
                            </span>
                          )}
                        </p>
                      </>
                    ) : (
                      <>
                        <h5 className="fw-bold mt-3 mb-2">¡Reserva confirmada!</h5>
                        <p className="fx-muted mb-3">
                          Tu lugar en <strong>{selectedClass.name}</strong> está apartado.<br />
                          Te esperamos el {DAYS[selectedClass.dayOfWeek].toLowerCase()} a las {selectedClass.startTime}.
                        </p>
                        <a
                          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "50660301104"}?text=${encodeURIComponent(
                            `Hola Force Extreme 👋 Soy *${form.name}* y acabo de reservar mi lugar en la clase de *${selectedClass.name}* el *${DAYS[selectedClass.dayOfWeek]}* a las *${selectedClass.startTime}*. ¡Confirmo mi asistencia!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success fw-semibold w-100 mb-2"
                          style={{ background: "#25d366", border: "none" }}
                        >
                          <i className="bi bi-whatsapp me-2" />Confirmar por WhatsApp
                        </a>
                      </>
                    )}
                    <button
                      className="btn btn-fx-outline btn-sm w-100"
                      onClick={() => setSelectedClass(null)}
                    >
                      Cerrar
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBooking}>
                    {loggedUser && (
                      <div className="d-flex align-items-center gap-2 mb-3 px-3 py-2 rounded small"
                        style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.25)" }}>
                        <i className="bi bi-person-check-fill" style={{ color: "var(--fx-accent)" }} />
                        <span>Reservando como <strong>{loggedUser.name}</strong></span>
                        <a href="/portal/mis-reservas" className="ms-auto small" style={{ color: "var(--fx-accent)" }}>
                          Ver mis reservas
                        </a>
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Nombre *</label>
                      <input
                        className="form-control" type="text" required
                        value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">WhatsApp *</label>
                      <input
                        className="form-control" type="tel" required
                        value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="6030-1104"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Email <span className="text-muted">(opcional)</span></label>
                      <input
                        className="form-control" type="email"
                        value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="tu@correo.com"
                      />
                    </div>

                    {bookingStatus === "error" && (
                      <div className="alert alert-danger py-2 small">{errorMsg}</div>
                    )}

                    <button
                      type="submit"
                      className={`btn w-100 fw-semibold ${modalMode === "waitlist" ? "btn-fx-outline" : "btn-fx"}`}
                      disabled={bookingStatus === "loading"}
                    >
                      {bookingStatus === "loading" ? (
                        <><span className="spinner-border spinner-border-sm me-2" />{modalMode === "waitlist" ? "Anotando..." : "Reservando..."}</>
                      ) : modalMode === "waitlist" ? (
                        <><i className="bi bi-hourglass-split me-2" />Anotarme en lista de espera</>
                      ) : (
                        <><i className="bi bi-calendar-check me-2" />Confirmar reserva</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
