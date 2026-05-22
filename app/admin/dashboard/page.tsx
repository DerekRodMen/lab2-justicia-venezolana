"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getAdmin, logout,
  getLeads, getLeadStats, updateLead, deleteLead,
  getClasses, createClass, updateClass, deleteClass, getBookings, cancelBooking, confirmBooking,
  type Lead, type LeadStats, type ClassSchedule, type Booking,
} from "@/lib/api";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NUEVO:      { label: "Nuevo",      color: "primary" },
  CONTACTADO: { label: "Contactado", color: "info" },
  EN_PROCESO: { label: "En proceso", color: "warning" },
  CONVERTIDO: { label: "Convertido", color: "success" },
  PERDIDO:    { label: "Perdido",    color: "secondary" },
};

const DAYS     = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type Tab = "leads" | "clases" | "reservas" | "stats";
const emptyClass = { name: "", instructor: "", dayOfWeek: 1, startTime: "07:00", endTime: "08:00", capacity: 15 };

export default function Dashboard() {
  const router = useRouter();

  // — Auth: string primitives avoid new-object-on-every-render pitfall
  const [adminName, setAdminName] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  // — Data
  const [leads,   setLeads]   = useState<Lead[]>([]);
  const [stats,   setStats]   = useState<LeadStats | null>(null);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [bookings,setBookings]= useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // — UI
  const [activeTab,      setActiveTab]      = useState<Tab>("leads");
  const [filterStatus,   setFilterStatus]   = useState("");
  const [bookingFilter,  setBookingFilter]  = useState<number | "">("");
  const [searchQuery,    setSearchQuery]    = useState("");

  // — Toasts
  const [toasts, setToasts] = useState<{ id: number; msg: string; ok: boolean }[]>([]);
  function toast(msg: string, ok = true) {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, ok }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }

  // — Lead edit modal
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editNotes,   setEditNotes]   = useState("");
  const [editStatus,  setEditStatus]  = useState("");

  // — Class create/edit modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass,   setEditingClass]   = useState<ClassSchedule | null>(null);
  const [classForm,      setClassForm]      = useState(emptyClass);
  const [classSaving,    setClassSaving]    = useState(false);

  // ── Auth check (runs once on mount) ─────────────────────────────────────
  useEffect(() => {
    const stored = getAdmin();
    if (!stored) { router.replace("/admin"); return; }
    setAdminName(stored.name);
    setAuthenticated(true);
  }, [router]);

  // ── Data fetch (re-runs when filters change, not on every render) ────────
  const loadAll = async (status: string, bFilter: number | "") => {
    try {
      const [leadsData, statsData, classesData, bookingsData] = await Promise.all([
        getLeads(status || undefined),
        getLeadStats(),
        getClasses(),
        getBookings(bFilter || undefined),
      ]);
      setLeads(leadsData);
      setStats(statsData);
      setClasses(classesData);
      setBookings(bookingsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        logout();
        router.replace("/admin");
      }
    } finally {
      setLoading(false);
    }
  };

  // Keep latest filter values accessible inside the stable loadAll ref
  const filterRef = useRef({ filterStatus, bookingFilter });
  filterRef.current = { filterStatus, bookingFilter };

  useEffect(() => {
    if (!authenticated) return;
    setLoading(true);
    loadAll(filterStatus, bookingFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, filterStatus, bookingFilter]);

  // ── Silent auto-refresh every 60 s ──────────────────────────────────────
  const prevLeadTotal = useRef(0);
  useEffect(() => {
    if (!authenticated) return;
    const id = setInterval(async () => {
      const { filterStatus: s, bookingFilter: b } = filterRef.current;
      try {
        const [l, st, c, bk] = await Promise.all([
          getLeads(s || undefined),
          getLeadStats(),
          getClasses(),
          getBookings(b || undefined),
        ]);
        if (prevLeadTotal.current > 0 && st.total > prevLeadTotal.current) {
          toast(`${st.total - prevLeadTotal.current} nuevo(s) lead(s)`);
        }
        prevLeadTotal.current = st.total;
        setLeads(l);
        setStats(st);
        setClasses(c);
        setBookings(bk);
      } catch { /* ignore silent-refresh errors */ }
    }, 60_000);
    return () => clearInterval(id);
  }, [authenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Lead actions ─────────────────────────────────────────────────────────
  async function handleUpdateLead() {
    if (!editingLead) return;
    try {
      await updateLead(editingLead.id, { status: editStatus, notes: editNotes });
      setEditingLead(null);
      loadAll(filterRef.current.filterStatus, filterRef.current.bookingFilter);
      toast("Lead actualizado");
    } catch {
      toast("Error al actualizar el lead", false);
    }
  }

  async function handleDeleteLead(id: number) {
    if (!confirm("¿Eliminar este lead?")) return;
    try {
      await deleteLead(id);
      loadAll(filterRef.current.filterStatus, filterRef.current.bookingFilter);
      toast("Lead eliminado");
    } catch {
      toast("Error al eliminar el lead", false);
    }
  }

  function openEditLead(lead: Lead) {
    setEditingLead(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.notes ?? "");
  }

  // ── Class actions ─────────────────────────────────────────────────────────
  function openCreateClass() {
    setEditingClass(null);
    setClassForm(emptyClass);
    setShowClassModal(true);
  }

  function openEditClass(cls: ClassSchedule) {
    setEditingClass(cls);
    setClassForm({
      name:       cls.name,
      instructor: cls.instructor,
      dayOfWeek:  cls.dayOfWeek,
      startTime:  cls.startTime,
      endTime:    cls.endTime,
      capacity:   cls.capacity,
    });
    setShowClassModal(true);
  }

  async function handleSaveClass(e: FormEvent) {
    e.preventDefault();
    setClassSaving(true);
    try {
      if (editingClass) {
        await updateClass(editingClass.id, classForm as Partial<ClassSchedule>);
        toast("Clase actualizada");
      } else {
        await createClass({ ...classForm, isActive: true } as Omit<ClassSchedule, "id" | "_count">);
        toast("Clase creada");
      }
      setShowClassModal(false);
      const fresh = await getClasses();
      setClasses(fresh);
    } catch {
      toast("Error al guardar la clase", false);
    } finally {
      setClassSaving(false);
    }
  }

  async function handleToggleClass(cls: ClassSchedule) {
    try {
      await updateClass(cls.id, { isActive: !cls.isActive } as Partial<ClassSchedule>);
      const fresh = await getClasses();
      setClasses(fresh);
      toast(cls.isActive ? "Clase pausada" : "Clase activada");
    } catch {
      toast("Error al cambiar estado", false);
    }
  }

  async function handleDeleteClass(cls: ClassSchedule) {
    const msg = cls._count.bookings > 0
      ? `¿Eliminar "${cls.name}"? Se eliminarán también sus ${cls._count.bookings} reservas.`
      : `¿Eliminar "${cls.name}"?`;
    if (!confirm(msg)) return;
    try {
      await deleteClass(cls.id);
      const fresh = await getClasses();
      setClasses(fresh);
      toast(`"${cls.name}" eliminada`);
    } catch {
      toast("Error al eliminar la clase", false);
    }
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function exportLeadsCSV() {
    const headers = ["Nombre", "Teléfono", "Objetivo", "Estado", "Mensaje", "Notas", "Fecha"];
    const rows = leads.map((l) => [
      l.name, l.phone, l.goal,
      STATUS_LABELS[l.status]?.label ?? l.status,
      l.message ?? "", l.notes ?? "",
      new Date(l.createdAt).toLocaleDateString("es-CR"),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-forceextreme-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportBookingsCSV() {
    const headers = ["Nombre", "Teléfono", "Clase", "Día", "Horario", "Estado", "Fecha reserva"];
    const rows = bookings.map((b) => [
      b.name, b.phone,
      b.classSchedule?.name ?? `Clase #${b.classScheduleId}`,
      b.classSchedule ? DAYS_FULL[b.classSchedule.dayOfWeek] ?? "" : "",
      b.classSchedule ? `${b.classSchedule.startTime} – ${b.classSchedule.endTime}` : "",
      b.status === "PENDIENTE" ? "Pendiente" : b.status === "CONFIRMADO" ? "Confirmado" : "Cancelado",
      new Date(b.createdAt).toLocaleDateString("es-CR"),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservas-forceextreme-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Booking actions ────────────────────────────────────────────────────────
  async function handleConfirmBooking(id: number) {
    try {
      await confirmBooking(id);
      const [fresh, freshClasses] = await Promise.all([
        getBookings(filterRef.current.bookingFilter || undefined),
        getClasses(),
      ]);
      setBookings(fresh);
      setClasses(freshClasses);
      toast("Reserva confirmada");
    } catch {
      toast("Error al confirmar la reserva", false);
    }
  }

  async function handleCancelBooking(id: number) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    try {
      await cancelBooking(id);
      const [fresh, freshClasses] = await Promise.all([
        getBookings(filterRef.current.bookingFilter || undefined),
        getClasses(),
      ]);
      setBookings(fresh);
      setClasses(freshClasses);
      toast("Reserva cancelada");
    } catch {
      toast("Error al cancelar la reserva", false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: "var(--fx-bg)" }}>
        <div className="spinner-border" style={{ color: "var(--fx-accent)" }} />
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ background: "var(--fx-bg)", color: "var(--fx-text)" }}>
      {/* Navbar */}
      <nav className="navbar px-4 py-3 border-bottom border-secondary">
        <div className="d-flex align-items-center gap-3">
          <span className="fw-black" style={{ color: "var(--fx-accent)" }}>FORCE EXTREME</span>
          <span className="badge bg-secondary small">Admin</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="small text-muted d-none d-md-inline">{adminName}</span>
          <a href="/" className="btn btn-sm btn-fx-outline" target="_blank" rel="noreferrer">
            <i className="bi bi-eye me-1" />Ver sitio
          </a>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { logout(); router.push("/admin"); }}>
            <i className="bi bi-box-arrow-right me-1" />Salir
          </button>
        </div>
      </nav>

      <div className="container-fluid px-4 py-4">
        {/* Stats */}
        {stats && (
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-2">
              <div className="card border-0 text-center py-3" style={{ background: "var(--fx-surface)" }}>
                <div className="fs-3 fw-black" style={{ color: "var(--fx-accent)" }}>{stats.total}</div>
                <div className="small text-muted">Total leads</div>
              </div>
            </div>
            {stats.byStatus.slice(0, 4).map((s) => (
              <div key={s.status} className="col-6 col-md-2">
                <div className="card border-0 text-center py-3" style={{ background: "var(--fx-surface)" }}>
                  <div className="fs-3 fw-black" style={{ color: "var(--fx-accent)" }}>{s._count.id}</div>
                  <div className="small text-muted">{STATUS_LABELS[s.status]?.label ?? s.status}</div>
                </div>
              </div>
            ))}
            <div className="col-6 col-md-2">
              <div className="card border-0 text-center py-3" style={{ background: "var(--fx-surface)" }}>
                <div className="fs-3 fw-black" style={{ color: "var(--fx-accent)" }}>
                  {bookings.filter((b) => b.status !== "CANCELADO").length}
                </div>
                <div className="small text-muted">Reservas</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-tabs border-secondary mb-3">
          {([
            { id: "leads",   icon: "bi-people",            label: `Leads (${leads.length})` },
            { id: "clases",  icon: "bi-calendar3",         label: `Clases (${classes.length})` },
            { id: "reservas",icon: "bi-ticket-perforated", label: `Reservas (${bookings.filter((b) => b.status !== "CANCELADO").length})` },
            { id: "stats",   icon: "bi-bar-chart-line",    label: "Estadísticas" },
          ] as { id: Tab; icon: string; label: string }[]).map((t) => (
            <li key={t.id} className="nav-item">
              <button
                className={`nav-link ${activeTab === t.id ? "active" : "text-muted"}`}
                onClick={() => setActiveTab(t.id)}
              >
                <i className={`bi ${t.icon} me-2`} />{t.label}
              </button>
            </li>
          ))}
        </ul>

        {/* ── LEADS ── */}
        {activeTab === "leads" && (
          <>
            <div className="d-flex gap-2 mb-3 flex-wrap align-items-center justify-content-between">
              <div className="d-flex gap-2 flex-wrap">
                {["", ...Object.keys(STATUS_LABELS)].map((s) => (
                  <button
                    key={s}
                    className={`btn btn-sm ${filterStatus === s ? "btn-fx" : "btn-fx-outline"}`}
                    onClick={() => setFilterStatus(s)}
                  >
                    {s ? STATUS_LABELS[s].label : "Todos"}
                  </button>
                ))}
              </div>
              <div className="d-flex gap-2">
                <input
                  className="form-control form-control-sm"
                  style={{ maxWidth: 200 }}
                  placeholder="Buscar nombre o teléfono…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-sm btn-fx-outline" title="Exportar CSV" onClick={exportLeadsCSV}>
                  <i className="bi bi-download me-1" />CSV
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr className="text-muted small text-uppercase">
                    <th>Nombre</th><th>Teléfono</th><th>Objetivo</th><th>Estado</th><th>Fecha</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.filter((l) => {
                    const q = searchQuery.toLowerCase();
                    return !q || l.name.toLowerCase().includes(q) || l.phone.includes(q);
                  }).length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted py-4">Sin leads todavía</td></tr>
                  )}
                  {leads.filter((l) => {
                    const q = searchQuery.toLowerCase();
                    return !q || l.name.toLowerCase().includes(q) || l.phone.includes(q);
                  }).map((lead) => (
                    <tr key={lead.id}>
                      <td className="fw-semibold">{lead.name}</td>
                      <td>
                        <a
                          href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${lead.name}, te contactamos de Force Extreme. Vi que estás interesado en *${lead.goal}*. ¿Podemos coordinar una visita?`)}`}
                          target="_blank" rel="noreferrer"
                          className="text-decoration-none" style={{ color: "var(--fx-text)" }}
                          title="Abrir WhatsApp con mensaje pre-cargado"
                        >
                          <i className="bi bi-whatsapp me-1 text-success" />{lead.phone}
                        </a>
                      </td>
                      <td className="small">{lead.goal}</td>
                      <td>
                        <span className={`badge bg-${STATUS_LABELS[lead.status]?.color ?? "secondary"}`}>
                          {STATUS_LABELS[lead.status]?.label ?? lead.status}
                        </span>
                      </td>
                      <td className="small text-muted">{new Date(lead.createdAt).toLocaleDateString("es-CR")}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-fx-outline" onClick={() => openEditLead(lead)}>
                            <i className="bi bi-pencil" />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteLead(lead.id)}>
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── CLASES ── */}
        {activeTab === "clases" && (
          <>
            <div className="d-flex justify-content-end mb-3">
              <button className="btn btn-fx fw-semibold" onClick={openCreateClass}>
                <i className="bi bi-plus-lg me-2" />Nueva clase
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr className="text-muted small text-uppercase">
                    <th>Clase</th><th>Instructor</th><th>Día</th><th>Horario</th><th>Reservas / Cap.</th><th>Estado</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => (
                    <tr key={c.id} style={{ opacity: c.isActive ? 1 : 0.5 }}>
                      <td className="fw-semibold">{c.name}</td>
                      <td>{c.instructor}</td>
                      <td>{DAYS[c.dayOfWeek]}</td>
                      <td>{c.startTime} – {c.endTime}</td>
                      <td>
                        <span className={c._count.bookings >= c.capacity ? "text-danger fw-bold" : "text-success"}>
                          {c._count.bookings}
                        </span>
                        <span className="text-muted"> / {c.capacity}</span>
                      </td>
                      <td>
                        <span className={`badge ${c.isActive ? "bg-success" : "bg-secondary"}`}>
                          {c.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-fx-outline" title="Editar" onClick={() => openEditClass(c)}>
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            className={`btn btn-sm ${c.isActive ? "btn-outline-warning" : "btn-outline-success"}`}
                            title={c.isActive ? "Pausar" : "Activar"}
                            onClick={() => handleToggleClass(c)}
                          >
                            <i className={`bi ${c.isActive ? "bi-pause-fill" : "bi-play-fill"}`} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-info"
                            title="Ver reservas"
                            onClick={() => { setBookingFilter(c.id); setActiveTab("reservas"); }}
                          >
                            <i className="bi bi-ticket-perforated" />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Eliminar clase"
                            onClick={() => handleDeleteClass(c)}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── RESERVAS ── */}
        {activeTab === "reservas" && (
          <>
            <div className="d-flex gap-2 mb-3 align-items-center flex-wrap">
              <select
                className="form-select form-select-sm"
                style={{ maxWidth: 240 }}
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Todas las clases</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} – {DAYS[c.dayOfWeek]} {c.startTime}
                  </option>
                ))}
              </select>
              <span className="small text-muted">
                {bookings.filter((b) => b.status !== "CANCELADO").length} reservas activas
              </span>
              <button className="btn btn-sm btn-fx-outline ms-auto" title="Exportar CSV" onClick={exportBookingsCSV}>
                <i className="bi bi-download me-1" />CSV
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr className="text-muted small text-uppercase">
                    <th>Nombre</th><th>Teléfono</th><th>Clase</th><th>Estado</th><th>Fecha</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted py-4">Sin reservas</td></tr>
                  )}
                  {bookings.map((b) => (
                    <tr key={b.id} style={{ opacity: b.status === "CANCELADO" ? 0.5 : 1 }}>
                      <td className="fw-semibold">{b.name}</td>
                      <td>
                        <a href={`https://wa.me/${b.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                          className="text-decoration-none" style={{ color: "var(--fx-text)" }}>
                          <i className="bi bi-whatsapp me-1 text-success" />{b.phone}
                        </a>
                      </td>
                      <td className="small">
                        {b.classSchedule
                          ? `${b.classSchedule.name} · ${b.classSchedule.startTime}`
                          : `Clase #${b.classScheduleId}`}
                      </td>
                      <td>
                        <span className={`badge ${
                          b.status === "CONFIRMADO" ? "bg-success" :
                          b.status === "CANCELADO"  ? "bg-secondary" : "bg-warning text-dark"
                        }`}>
                          {b.status === "PENDIENTE" ? "Pendiente" : b.status === "CONFIRMADO" ? "Confirmado" : "Cancelado"}
                        </span>
                      </td>
                      <td className="small text-muted">{new Date(b.createdAt).toLocaleDateString("es-CR")}</td>
                      <td>
                        <div className="d-flex gap-1">
                          {b.status === "PENDIENTE" && (
                            <button className="btn btn-sm btn-outline-success" title="Confirmar" onClick={() => handleConfirmBooking(b.id)}>
                              <i className="bi bi-check-lg" />
                            </button>
                          )}
                          {b.status !== "CANCELADO" && (
                            <button className="btn btn-sm btn-outline-danger" title="Cancelar" onClick={() => handleCancelBooking(b.id)}>
                              <i className="bi bi-x-lg" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── ESTADÍSTICAS ── */}
        {activeTab === "stats" && stats && (
          <>
            {/* KPIs rápidos */}
            <div className="row g-3 mb-4">
              {[
                {
                  label: "Tasa de conversión",
                  value: stats.total > 0
                    ? `${Math.round(((stats.byStatus.find((s) => s.status === "CONVERTIDO")?._count.id ?? 0) / stats.total) * 100)}%`
                    : "0%",
                  icon: "bi-graph-up-arrow", color: "#198754",
                },
                {
                  label: "Leads activos",
                  value: stats.byStatus.filter((s) => !["CONVERTIDO","PERDIDO"].includes(s.status)).reduce((a, s) => a + s._count.id, 0),
                  icon: "bi-hourglass-split", color: "var(--fx-accent)",
                },
                {
                  label: "Clases activas",
                  value: classes.filter((c) => c.isActive).length,
                  icon: "bi-calendar-check", color: "#0dcaf0",
                },
                {
                  label: "Reservas activas",
                  value: bookings.filter((b) => b.status !== "CANCELADO").length,
                  icon: "bi-ticket-perforated", color: "#a78bfa",
                },
              ].map((kpi) => (
                <div key={kpi.label} className="col-6 col-md-3">
                  <div className="fx-surface p-3 h-100 d-flex align-items-center gap-3">
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${kpi.color}22`, display: "grid", placeItems: "center", border: `1px solid ${kpi.color}44` }}>
                      <i className={`bi ${kpi.icon}`} style={{ color: kpi.color, fontSize: "1.1rem" }} />
                    </div>
                    <div>
                      <div className="fw-black fs-4" style={{ color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                      <div className="small" style={{ color: "rgba(255,255,255,0.58)" }}>{kpi.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-4 mb-4">
              {/* Pipeline de leads */}
              <div className="col-lg-6">
                <div className="fx-surface p-4 h-100">
                  <h6 className="fw-bold mb-4">Pipeline de leads</h6>
                  {stats.byStatus.map((s) => {
                    const pct = stats.total > 0 ? Math.round((s._count.id / stats.total) * 100) : 0;
                    const color = ({ NUEVO:"#0d6efd", CONTACTADO:"#0dcaf0", EN_PROCESO:"#ffc107", CONVERTIDO:"#198754", PERDIDO:"#6c757d" } as Record<string,string>)[s.status] ?? "var(--fx-accent)";
                    return (
                      <div key={s.status} className="mb-3">
                        <div className="d-flex justify-content-between small mb-1">
                          <span style={{ color: "rgba(255,255,255,0.82)" }}>{STATUS_LABELS[s.status]?.label ?? s.status}</span>
                          <span className="fw-semibold">{s._count.id} <span style={{ color: "rgba(255,255,255,0.45)" }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: 7, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Objetivos */}
              <div className="col-lg-6">
                <div className="fx-surface p-4 h-100">
                  <h6 className="fw-bold mb-4">Objetivos más frecuentes</h6>
                  {stats.byGoal.length === 0 && <p className="small" style={{ color: "rgba(255,255,255,0.5)" }}>Sin datos aún</p>}
                  {stats.byGoal.slice(0, 6).map((g) => {
                    const max = stats.byGoal[0]?._count.id ?? 1;
                    const pct = Math.round((g._count.id / max) * 100);
                    return (
                      <div key={g.goal} className="mb-3">
                        <div className="d-flex justify-content-between small mb-1">
                          <span style={{ color: "rgba(255,255,255,0.82)" }}>{g.goal}</span>
                          <span className="fw-semibold">{g._count.id}</span>
                        </div>
                        <div style={{ height: 7, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "var(--fx-accent)", borderRadius: 999, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ocupación de clases */}
            <div className="fx-surface p-4">
              <h6 className="fw-bold mb-4">Ocupación de clases</h6>
              {classes.length === 0 && <p className="small" style={{ color: "rgba(255,255,255,0.5)" }}>Sin clases todavía</p>}
              <div className="row g-3">
                {[...classes].sort((a, b) => b._count.bookings - a._count.bookings).map((c) => {
                  const pct = c.capacity > 0 ? Math.round((c._count.bookings / c.capacity) * 100) : 0;
                  const color = pct >= 100 ? "#dc3545" : pct >= 70 ? "#ffc107" : "#198754";
                  return (
                    <div key={c.id} className="col-md-6">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>
                          <span className="fw-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{c.name}</span>
                          <span style={{ color: "rgba(255,255,255,0.45)" }}> · {DAYS[c.dayOfWeek]} {c.startTime}</span>
                        </span>
                        <span className="fw-semibold" style={{ color }}>{c._count.bookings}/{c.capacity}</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 999, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL EDITAR LEAD ── */}
      {editingLead && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setEditingLead(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0" style={{ background: "var(--fx-surface)", backdropFilter: "blur(16px)" }}>
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title fw-bold mb-0">{editingLead.name}</h5>
                  <p className="small text-muted mb-0">{editingLead.phone} · {editingLead.goal}</p>
                </div>
                <button className="btn-close btn-close-white" onClick={() => setEditingLead(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Estado</label>
                  <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Notas internas</label>
                  <textarea className="form-control" rows={3}
                    value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Seguimiento, preferencias..."
                  />
                </div>
                {editingLead.message && (
                  <div className="p-3 rounded small" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <span className="text-muted">Mensaje original: </span>{editingLead.message}
                  </div>
                )}
              </div>
              <div className="modal-footer border-secondary">
                <button className="btn btn-fx-outline" onClick={() => setEditingLead(null)}>Cancelar</button>
                <button className="btn btn-fx" onClick={handleUpdateLead}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOASTS ── */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`d-flex align-items-center gap-2 px-3 py-2 rounded shadow-lg small fw-semibold`}
            style={{
              background: t.ok ? "rgba(25,135,84,0.92)" : "rgba(220,53,69,0.92)",
              color: "#fff",
              backdropFilter: "blur(8px)",
              minWidth: 220,
              animation: "fadeInUp 0.2s ease",
            }}
          >
            <i className={`bi ${t.ok ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}`} />
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── MODAL CLASE ── */}
      {showClassModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => !classSaving && setShowClassModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0" style={{ background: "var(--fx-surface)", backdropFilter: "blur(16px)" }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">{editingClass ? "Editar clase" : "Nueva clase"}</h5>
                {!classSaving && <button className="btn-close btn-close-white" onClick={() => setShowClassModal(false)} />}
              </div>
              <form onSubmit={handleSaveClass}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Nombre</label>
                      <input className="form-control" required value={classForm.name}
                        onChange={(e) => setClassForm((f) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Instructor</label>
                      <input className="form-control" required value={classForm.instructor}
                        onChange={(e) => setClassForm((f) => ({ ...f, instructor: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Día</label>
                      <select className="form-select" value={classForm.dayOfWeek}
                        onChange={(e) => setClassForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}>
                        {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Inicio</label>
                      <input className="form-control" type="time" required value={classForm.startTime}
                        onChange={(e) => setClassForm((f) => ({ ...f, startTime: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Fin</label>
                      <input className="form-control" type="time" required value={classForm.endTime}
                        onChange={(e) => setClassForm((f) => ({ ...f, endTime: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Capacidad</label>
                      <input className="form-control" type="number" min={1} required value={classForm.capacity}
                        onChange={(e) => setClassForm((f) => ({ ...f, capacity: Number(e.target.value) }))} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-fx-outline" onClick={() => setShowClassModal(false)} disabled={classSaving}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-fx" disabled={classSaving}>
                    {classSaving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                      : editingClass ? "Guardar cambios" : "Crear clase"
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
