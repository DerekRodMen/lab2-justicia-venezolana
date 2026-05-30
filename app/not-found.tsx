import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center text-center px-3"
      style={{ background: "var(--fx-bg)", color: "var(--fx-text)" }}
    >
      <div style={{ maxWidth: 460 }}>
        <div className="fw-black mb-2" style={{ fontSize: "5rem", lineHeight: 1, color: "var(--fx-accent)" }}>
          404
        </div>
        <h1 className="fw-bold h3 mb-2">Página no encontrada</h1>
        <p className="fx-muted mb-4">
          La página que buscas no existe o fue movida. Volvamos a entrenar.
        </p>
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          <Link href="/" className="btn btn-fx fw-semibold">
            <i className="bi bi-house-door me-2" />Ir al inicio
          </Link>
          <Link href="/#horarios" className="btn btn-fx-outline">
            <i className="bi bi-calendar-check me-2" />Ver clases
          </Link>
        </div>
      </div>
    </div>
  );
}
