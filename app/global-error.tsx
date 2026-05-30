"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07090d",
          color: "rgba(255,255,255,0.93)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ color: "#ff3b30", fontWeight: 900 }}>Force Extreme</h1>
          <p style={{ opacity: 0.7 }}>
            Ocurrió un error crítico. Por favor recarga la página.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#ff3b30",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.6rem 1.2rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
