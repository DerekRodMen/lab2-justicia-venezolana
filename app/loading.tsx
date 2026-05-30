export default function Loading() {
  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center gap-3"
      style={{ background: "var(--fx-bg)" }}
    >
      <div className="spinner-border" style={{ color: "var(--fx-accent)" }} role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
      <span className="fw-black" style={{ color: "var(--fx-accent)", letterSpacing: "0.1em" }}>
        FORCE EXTREME
      </span>
    </div>
  );
}
