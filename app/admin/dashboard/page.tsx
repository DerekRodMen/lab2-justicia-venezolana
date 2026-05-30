"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getAdmin, logout,
  getLeads, getLeadStats, updateLead, deleteLead,
  getClasses, createClass, updateClass, deleteClass, getBookings, cancelBooking, confirmBooking, markAttendance,
  getInstructors, createInstructor, updateInstructor, deleteInstructor,
  getWaitlist, removeFromWaitlist,
  getAllMemberships, upsertMembership, deleteMembership, getReviewSummary,
  listAdmins, createAdmin, updateAdminRole, removeAdmin,
  type Lead, type LeadStats, type ClassSchedule, type Booking, type Instructor, type WaitlistEntry,
  type Membership, type ReviewSummary, type AdminUser,
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

type Tab = "leads" | "clases" | "reservas" | "instructores" | "espera" | "membresias" | "equipo" | "stats";
const emptyClass = { name: "", instructor: "", dayOfWeek: 1, startTime: "07:00", endTime: "08:00", capacity: 15 };
const emptyInstructor = { name: "", bio: "", specialty: "", photoUrl: "", order: 0 };

export default function Dashboard() {
  const router = useRouter();

  // — Auth: string primitives avoid new-object-on-every-render pitfall
  const [adminName, setAdminName] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  // — Data
  const [leads,   setLeads]   = useState<Lead[]>([]);
  const [stats,   setStats]   = useState<LeadStats | null>(null);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [bookings,    setBookings]    = useState<Booking[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [waitlist,      setWaitlist]      = useState<WaitlistEntry[]>([]);
  const [memberships,   setMemberships]   = useState<Membership[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary[]>([]);
  const [admins,        setAdmins]        = useState<AdminUser[]>([]);
  const [currentRole,   setCurrentRole]   = useState<string>("");

  // — New admin modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "", role: "ADMIN" });
  const [adminSaving, setAdminSaving] = useState(false);

  // — Membership modal
  const [showMemModal,  setShowMemModal]  = useState(false);
  const [memUserId,     setMemUserId]     = useState("");
  const [memPlan,       setMemPlan]       = useState("PRO");
  const [memStart,      setMemStart]      = useState(new Date().toISOString().slice(0,10));
  const [memEnd,        setMemEnd]        = useState("");
  const [memNotes,      setMemNotes]      = useState("");
  const [memSaving,     setMemSaving]     = useState(false);
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

  // — Instructor create/edit modal
  const [showInstModal, setShowInstModal] = useState(false);
  const [editingInst,   setEditingInst]   = useState<Instructor | null>(null);
  const [instForm,      setInstForm]      = useState(emptyInstructor);
  const [instSaving,    setInstSaving]    = useState(false);

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
      const [leadsData, statsData, classesData, bookingsData, instructorsData, waitlistData, membershipsData, reviewData, adminsData] = await Promise.all([
        getLeads(status || undefined),
        getLeadStats(),
        getClasses(),
        getBookings(bFilter || undefined),
        getInstructors(),
        getWaitlist(bFilter || undefined),
        getAllMemberships(),
        getReviewSummary(),
        listAdmins(),
      ]);
      setLeads(leadsData);
      setStats(statsData);
      setClasses(classesData);
      setBookings(bookingsData);
      setInstructors(instructorsData);
      setWaitlist(waitlistData);
      setMemberships(membershipsData);
      setReviewSummary(reviewData);
      setAdmins(adminsData);
      const stored = getAdmin();
      setCurrentRole(stored?.role ?? "");
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
        const [l, st, c, bk, inst, wl, mem, rev, adm] = await Promise.all([
          getLeads(s || undefined),
          getLeadStats(),
          getClasses(),
          getBookings(b || undefined),
          getInstructors(),
          getWaitlist(b || undefined),
          getAllMemberships(),
          getReviewSummary(),
          listAdmins(),
        ]);
        if (prevLeadTotal.current > 0 && st.total > prevLeadTotal.current) {
          toast(`${st.total - prevLeadTotal.current} nuevo(s) lead(s)`);
        }
        prevLeadTotal.current = st.total;
        setLeads(l);
        setStats(st);
        setClasses(c);
        setBookings(bk);
        setInstructors(inst);
        setWaitlist(wl);
        setMemberships(mem);
        setReviewSummary(rev);
        setAdmins(adm);
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

  // ── Check-in ──────────────────────────────────────────────────────────────
  async function handleAttendance(id: number, attended: boolean) {
    try {
      await markAttendance(id, attended);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, attended } : b));
      toast(attended ? "Asistencia registrada" : "Inasistencia registrada");
    } catch {
      toast("Error al registrar asistencia", false);
    }
  }

  // ── Instructor actions ────────────────────────────────────────────────────
  function openNewInstructor() {
    setEditingInst(null);
    setInstForm(emptyInstructor);
    setShowInstModal(true);
  }

  function openEditInstructor(inst: Instructor) {
    setEditingInst(inst);
    setInstForm({ name: inst.name, bio: inst.bio ?? "", specialty: inst.specialty ?? "", photoUrl: inst.photoUrl ?? "", order: inst.order });
    setShowInstModal(true);
  }

  async function handleSaveInstructor(e: FormEvent) {
    e.preventDefault();
    setInstSaving(true);
    try {
      if (editingInst) {
        const updated = await updateInstructor(editingInst.id, instForm);
        setInstructors((prev) => prev.map((i) => i.id === editingInst.id ? updated : i));
        toast("Instructor actualizado");
      } else {
        const created = await createInstructor(instForm);
        setInstructors((prev) => [...prev, created].sort((a, b) => a.order - b.order));
        toast("Instructor creado");
      }
      setShowInstModal(false);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al guardar", false);
    } finally {
      setInstSaving(false);
    }
  }

  async function handleDeleteInstructor(inst: Instructor) {
    if (!confirm(`¿Eliminar al instructor "${inst.name}"?`)) return;
    try {
      await deleteInstructor(inst.id);
      setInstructors((prev) => prev.filter((i) => i.id !== inst.id));
      toast("Instructor eliminado");
    } catch {
      toast("Error al eliminar", false);
    }
  }

  // ── Waitlist actions ──────────────────────────────────────────────────────
  async function handleRemoveWaitlist(id: number) {
    try {
      await removeFromWaitlist(id);
      setWaitlist((prev) => prev.filter((w) => w.id !== id));
      toast("Eliminado de lista de espera");
    } catch {
      toast("Error al eliminar", false);
    }
  }

  // ── Admin team actions ────────────────────────────────────────────────────
  async function handleCreateAdmin(e: FormEvent) {
    e.preventDefault();
    setAdminSaving(true);
    try {
      const created = await createAdmin(adminForm);
      setAdmins((prev) => [...prev, created]);
      toast(`Admin ${created.name} creado`);
      setShowAdminModal(false);
      setAdminForm({ name: "", email: "", password: "", role: "ADMIN" });
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al crear admin", false);
    } finally { setAdminSaving(false); }
  }

  async function handleRoleChange(id: number, role: string) {
    try {
      const updated = await updateAdminRole(id, role);
      setAdmins((prev) => prev.map((a) => a.id === id ? updated : a));
      toast("Rol actualizado");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al cambiar rol", false);
    }
  }

  async function handleRemoveAdmin(admin: AdminUser) {
    if (!confirm(`¿Eliminar al administrador ${admin.name}?`)) return;
    try {
      await removeAdmin(admin.id);
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      toast("Admin eliminado");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al eliminar", false);
    }
  }

  // ── Membership actions ────────────────────────────────────────────────────
  async function handleSaveMembership(e: FormEvent) {
    e.preventDefault();
    if (!memUserId || !memEnd) return;
    setMemSaving(true);
    try {
      const saved = await upsertMembership({ userId: Number(memUserId), plan: memPlan, startDate: memStart, endDate: memEnd, notes: memNotes || undefined });
      setMemberships((prev) => {
        const exists = prev.find((m) => m.userId === saved.userId);
        return exists ? prev.map((m) => m.userId === saved.userId ? saved : m) : [...prev, saved];
      });
      toast("Membresía guardada");
      setShowMemModal(false);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al guardar", false);
    } finally { setMemSaving(false); }
  }

  async function handleDeleteMembership(userId: number, name: string) {
    if (!confirm(`¿Eliminar membresía de ${name}?`)) return;
    try {
      await deleteMembership(userId);
      setMemberships((prev) => prev.filter((m) => m.userId !== userId));
      toast("Membresía eliminada");
    } catch { toast("Error al eliminar", false); }
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
            { id: "leads",        icon: "bi-people",            label: `Leads (${leads.length})` },
            { id: "clases",       icon: "bi-calendar3",         label: `Clases (${classes.length})` },
            { id: "reservas",     icon: "bi-ticket-perforated", label: `Reservas (${bookings.filter((b) => b.status !== "CANCELADO").length})` },
            { id: "instructores", icon: "bi-person-badge",      label: `Instructores (${instructors.length})` },
            { id: "espera",       icon: "bi-hourglass-split",   label: `Espera (${waitlist.length})` },
            { id: "membresias",   icon: "bi-card-checklist",    label: `Membresías (${memberships.filter(m=>m.isActive).length})` },
            { id: "equipo",       icon: "bi-people-fill",       label: `Equipo (${admins.length})` },
            { id: "stats",        icon: "bi-bar-chart-line",    label: "Estadísticas" },
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
                        <div className="d-flex gap-1 flex-wrap">
                          {b.status === "PENDIENTE" && (
                            <button className="btn btn-sm btn-outline-success" title="Confirmar reserva" onClick={() => handleConfirmBooking(b.id)}>
                              <i className="bi bi-check-lg" />
                            </button>
                          )}
                          {b.status !== "CANCELADO" && (
                            <button className="btn btn-sm btn-outline-danger" title="Cancelar reserva" onClick={() => handleCancelBooking(b.id)}>
                              <i className="bi bi-x-lg" />
                            </button>
                          )}
                          {b.status === "CONFIRMADO" && b.attended == null && (
                            <>
                              <button className="btn btn-sm btn-outline-primary" title="Asistió" onClick={() => handleAttendance(b.id, true)}>
                                <i className="bi bi-person-check" />
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" title="No se presentó" onClick={() => handleAttendance(b.id, false)}>
                                <i className="bi bi-person-x" />
                              </button>
                            </>
                          )}
                          {b.attended === true && <span className="badge bg-primary align-self-center">Asistió</span>}
                          {b.attended === false && <span className="badge bg-secondary align-self-center">No vino</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── INSTRUCTORES ── */}
        {activeTab === "instructores" && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="small text-muted">{instructors.length} instructor(es) activo(s)</span>
              <button className="btn btn-fx btn-sm fw-semibold" onClick={openNewInstructor}>
                <i className="bi bi-plus-lg me-1" />Agregar instructor
              </button>
            </div>

            {instructors.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-person-badge" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                <p className="mt-2 mb-0">No hay instructores todavía. Agrega el primero.</p>
              </div>
            ) : (
              <div className="row g-3">
                {instructors.map((inst) => (
                  <div key={inst.id} className="col-sm-6 col-lg-4">
                    <div className="fx-surface p-3 d-flex align-items-start gap-3">
                      {inst.photoUrl ? (
                        <img src={inst.photoUrl} alt={inst.name} className="rounded-circle flex-shrink-0"
                          style={{ width: 52, height: 52, objectFit: "cover", border: "2px solid rgba(255,59,48,0.3)" }} />
                      ) : (
                        <div className="icon-bubble flex-shrink-0" style={{ width: 52, height: 52 }}>
                          <i className="bi bi-person fs-5" />
                        </div>
                      )}
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-bold">{inst.name}</div>
                        {inst.specialty && <div className="small" style={{ color: "var(--fx-accent)" }}>{inst.specialty}</div>}
                        {inst.bio && <div className="small text-muted mt-1" style={{ lineHeight: 1.5 }}>{inst.bio}</div>}
                      </div>
                      <div className="d-flex gap-1 flex-shrink-0">
                        <button className="btn btn-sm btn-outline-secondary" title="Editar" onClick={() => openEditInstructor(inst)}>
                          <i className="bi bi-pencil" />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" title="Eliminar" onClick={() => handleDeleteInstructor(inst)}>
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── LISTA DE ESPERA ── */}
        {activeTab === "espera" && (
          <>
            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
              <select className="form-select form-select-sm" style={{ maxWidth: 240 }}
                onChange={(e) => { setBookingFilter(e.target.value ? Number(e.target.value) : ""); setActiveTab("espera"); }}>
                <option value="">Todas las clases</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} – {DAYS[c.dayOfWeek]} {c.startTime}</option>
                ))}
              </select>
              <span className="small text-muted">{waitlist.length} persona(s) esperando</span>
            </div>

            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr className="text-muted small text-uppercase">
                    <th>Nombre</th><th>Teléfono</th><th>Clase</th><th>Email</th><th>Desde</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted py-4">Sin personas en espera</td></tr>
                  )}
                  {waitlist.map((w) => (
                    <tr key={w.id}>
                      <td className="fw-semibold">{w.name}</td>
                      <td>
                        <a href={`https://wa.me/${w.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                          className="text-decoration-none" style={{ color: "var(--fx-text)" }}>
                          <i className="bi bi-whatsapp me-1 text-success" />{w.phone}
                        </a>
                      </td>
                      <td className="small">{w.classSchedule ? `${w.classSchedule.name} · ${w.classSchedule.startTime}` : `#${w.classScheduleId}`}</td>
                      <td className="small text-muted">{w.email ?? "—"}</td>
                      <td className="small text-muted">{new Date(w.createdAt).toLocaleDateString("es-CR")}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger" title="Quitar de lista" onClick={() => handleRemoveWaitlist(w.id)}>
                          <i className="bi bi-x-lg" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── MEMBRESÍAS ── */}
        {activeTab === "membresias" && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <span className="small text-muted">
                {memberships.filter(m => m.isActive).length} activa(s) · {memberships.filter(m => !m.isActive).length} vencida(s)
              </span>
              <button className="btn btn-fx btn-sm fw-semibold" onClick={() => {
                setMemUserId(""); setMemPlan("PRO");
                setMemStart(new Date().toISOString().slice(0,10)); setMemEnd(""); setMemNotes("");
                setShowMemModal(true);
              }}>
                <i className="bi bi-plus-lg me-1" />Asignar membresía
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr className="text-muted small text-uppercase">
                    <th>Usuario</th><th>Plan</th><th>Inicio</th><th>Vencimiento</th><th>Estado</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted py-4">Sin membresías registradas</td></tr>
                  )}
                  {memberships.map((m) => (
                    <tr key={m.id} style={{ opacity: m.isActive ? 1 : 0.55 }}>
                      <td>
                        <div className="fw-semibold">{m.user?.name ?? `Usuario #${m.userId}`}</div>
                        <div className="small text-muted">{m.user?.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${m.plan === "PREMIUM" ? "bg-warning text-dark" : m.plan === "PRO" ? "bg-danger" : "bg-secondary"}`}>
                          {m.plan}
                        </span>
                      </td>
                      <td className="small text-muted">{new Date(m.startDate).toLocaleDateString("es-CR")}</td>
                      <td className="small text-muted">{new Date(m.endDate).toLocaleDateString("es-CR")}</td>
                      <td>
                        <span className={`badge ${m.isActive ? "bg-success" : "bg-secondary"}`}>
                          {m.isActive ? "Activa" : "Vencida"}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger" title="Eliminar"
                          onClick={() => handleDeleteMembership(m.userId, m.user?.name ?? `#${m.userId}`)}>
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── EQUIPO (multi-admin) ── */}
        {activeTab === "equipo" && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <span className="small text-muted">{admins.length} miembro(s) del equipo</span>
              {currentRole === "SUPER_ADMIN" && (
                <button className="btn btn-fx btn-sm fw-semibold" onClick={() => setShowAdminModal(true)}>
                  <i className="bi bi-person-plus me-1" />Agregar admin
                </button>
              )}
            </div>

            <div className="row g-3">
              {admins.map((a) => (
                <div key={a.id} className="col-sm-6 col-lg-4">
                  <div className="fx-surface p-3 d-flex align-items-start gap-3">
                    <div className="icon-bubble flex-shrink-0" style={{ width: 44, height: 44 }}>
                      <i className="bi bi-person-fill" />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-bold">{a.name}</div>
                      <div className="small text-muted text-truncate">{a.email}</div>
                      {currentRole === "SUPER_ADMIN" ? (
                        <select
                          className="form-select form-select-sm mt-1"
                          value={a.role}
                          onChange={(e) => handleRoleChange(a.id, e.target.value)}
                          style={{ fontSize: "0.75rem" }}
                        >
                          <option value="SUPER_ADMIN">Super Admin</option>
                          <option value="ADMIN">Admin</option>
                          <option value="TRAINER">Entrenador</option>
                        </select>
                      ) : (
                        <span className={`badge mt-1 ${a.role === "SUPER_ADMIN" ? "bg-danger" : a.role === "ADMIN" ? "bg-primary" : "bg-secondary"}`}>
                          {a.role === "SUPER_ADMIN" ? "Super Admin" : a.role === "ADMIN" ? "Admin" : "Entrenador"}
                        </span>
                      )}
                    </div>
                    {currentRole === "SUPER_ADMIN" && a.role !== "SUPER_ADMIN" && (
                      <button className="btn btn-sm btn-outline-danger flex-shrink-0" title="Eliminar"
                        onClick={() => handleRemoveAdmin(a)}>
                        <i className="bi bi-trash" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {currentRole !== "SUPER_ADMIN" && (
              <div className="alert py-2 small mt-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                <i className="bi bi-shield-lock me-2" />Solo el Super Admin puede agregar, editar o eliminar miembros del equipo.
              </div>
            )}
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

            {/* Evaluaciones por clase */}
            {reviewSummary.length > 0 && (
              <div className="fx-surface p-4 mt-4">
                <h6 className="fw-bold mb-4">
                  <i className="bi bi-star-half me-2" style={{ color: "#ffc107" }} />
                  Evaluaciones por clase
                </h6>
                <div className="row g-3">
                  {reviewSummary.map((r) => (
                    <div key={r.name} className="col-sm-6 col-lg-4">
                      <div className="p-3 rounded" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="fw-semibold mb-1">{r.name}</div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-flex gap-1">
                            {[1,2,3,4,5].map((s) => (
                              <i key={s} className={`bi bi-star${s <= Math.round(r.average) ? "-fill" : ""}`}
                                style={{ color: "#ffc107", fontSize: "0.85rem" }} />
                            ))}
                          </div>
                          <span className="fw-bold">{r.average}</span>
                          <span className="text-muted small">({r.total} {r.total === 1 ? "reseña" : "reseñas"})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* ── MODAL NUEVO ADMIN ── */}
      {showAdminModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !adminSaving && setShowAdminModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0" style={{ background: "#13161c" }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold mb-0">Agregar miembro al equipo</h5>
                {!adminSaving && <button className="btn-close btn-close-white" onClick={() => setShowAdminModal(false)} />}
              </div>
              <form onSubmit={handleCreateAdmin}>
                <div className="modal-body d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small fw-semibold">Nombre *</label>
                    <input className="form-control" required value={adminForm.name}
                      onChange={(e) => setAdminForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold">Email *</label>
                    <input className="form-control" type="email" required value={adminForm.email}
                      onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold">Contraseña * (mín. 8 caracteres)</label>
                    <input className="form-control" type="password" required minLength={8}
                      value={adminForm.password}
                      onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold">Rol</label>
                    <select className="form-select" value={adminForm.role}
                      onChange={(e) => setAdminForm((f) => ({ ...f, role: e.target.value }))}>
                      <option value="ADMIN">Admin</option>
                      <option value="TRAINER">Entrenador</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-outline-secondary btn-sm"
                    disabled={adminSaving} onClick={() => setShowAdminModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-fx btn-sm fw-semibold" disabled={adminSaving}>
                    {adminSaving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Creando...</>
                      : <><i className="bi bi-person-plus me-2" />Crear admin</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL MEMBRESÍA ── */}
      {showMemModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !memSaving && setShowMemModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0" style={{ background: "#13161c" }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold mb-0">Asignar membresía</h5>
                {!memSaving && <button className="btn-close btn-close-white" onClick={() => setShowMemModal(false)} />}
              </div>
              <form onSubmit={handleSaveMembership}>
                <div className="modal-body d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small fw-semibold">ID del usuario *</label>
                    <input className="form-control" type="number" required placeholder="Ej: 5"
                      value={memUserId} onChange={(e) => setMemUserId(e.target.value)} />
                    <div className="form-text">Puedes ver el ID en la tab de reservas del usuario.</div>
                  </div>
                  <div>
                    <label className="form-label small fw-semibold">Plan *</label>
                    <select className="form-select" value={memPlan} onChange={(e) => setMemPlan(e.target.value)}>
                      <option value="BASICO">Básico</option>
                      <option value="PRO">Pro</option>
                      <option value="PREMIUM">Premium</option>
                    </select>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Inicio *</label>
                      <input className="form-control" type="date" required
                        value={memStart} onChange={(e) => setMemStart(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Vencimiento *</label>
                      <input className="form-control" type="date" required
                        value={memEnd} onChange={(e) => setMemEnd(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label small fw-semibold">Notas</label>
                    <input className="form-control" placeholder="Pago en efectivo, descuento, etc."
                      value={memNotes} onChange={(e) => setMemNotes(e.target.value)} />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-outline-secondary btn-sm"
                    disabled={memSaving} onClick={() => setShowMemModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-fx btn-sm fw-semibold" disabled={memSaving}>
                    {memSaving ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</> : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL INSTRUCTOR ── */}
      {showInstModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !instSaving && setShowInstModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0" style={{ background: "#13161c" }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold mb-0">
                  {editingInst ? "Editar instructor" : "Nuevo instructor"}
                </h5>
                {!instSaving && <button className="btn-close btn-close-white" onClick={() => setShowInstModal(false)} />}
              </div>
              <form onSubmit={handleSaveInstructor}>
                <div className="modal-body d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small fw-semibold">Nombre *</label>
                    <input className="form-control" required value={instForm.name}
                      onChange={(e) => setInstForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold">Especialidad</label>
                    <input className="form-control" placeholder="Ej: Fuerza & HIIT"
                      value={instForm.specialty}
                      onChange={(e) => setInstForm((f) => ({ ...f, specialty: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold">Biografía corta</label>
                    <textarea className="form-control" rows={3}
                      placeholder="Breve descripción del instructor..."
                      value={instForm.bio}
                      onChange={(e) => setInstForm((f) => ({ ...f, bio: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold">URL de foto</label>
                    <input className="form-control" type="url" placeholder="https://..."
                      value={instForm.photoUrl}
                      onChange={(e) => setInstForm((f) => ({ ...f, photoUrl: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold">Orden de aparición</label>
                    <input className="form-control" type="number" min={0}
                      value={instForm.order}
                      onChange={(e) => setInstForm((f) => ({ ...f, order: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-outline-secondary btn-sm"
                    disabled={instSaving} onClick={() => setShowInstModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-fx btn-sm fw-semibold" disabled={instSaving}>
                    {instSaving ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</> : "Guardar"}
                  </button>
                </div>
              </form>
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
