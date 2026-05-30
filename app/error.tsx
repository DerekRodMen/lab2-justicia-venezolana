"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción aquí se podría enviar a un servicio de logging.
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center text-center px-3"
      style={{ background: "var(--fx-bg)", color: "var(--fx-text)" }}
    >
      <div style={{ maxWidth: 460 }}>
        <div className="mb-3" style={{ fontSize: "3.5rem", color: "var(--fx-accent)" }}>
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <h1 className="fw-bold h3 mb-2">Algo salió mal</h1>
        <p className="fx-muted mb-4">
          Ocurrió un error inesperado. Puedes intentarlo de nuevo o volver al inicio.
        </p>
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          <button onClick={reset} className="btn btn-fx fw-semibold">
            <i className="bi bi-arrow-clockwise me-2" />Reintentar
          </button>
          <a href="/" className="btn btn-fx-outline">
            <i className="bi bi-house-door me-2" />Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
