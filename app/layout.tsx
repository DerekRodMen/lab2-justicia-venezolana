import type { Metadata } from "next";
import type { ReactNode } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./global.css";
import BootstrapClient from "../components/BootstrapClient";

export const metadata: Metadata = {
  title: "Force Extreme | Gimnasio en Costa Rica",
  description:
    "Entrena con estructura, técnica y acompañamiento real. Clases de Fuerza, HIIT, Funcional e Iniciación. Reserva tu lugar hoy.",
  keywords: ["gimnasio", "Costa Rica", "fuerza", "HIIT", "funcional", "entrenamiento"],
  openGraph: {
    title: "Force Extreme | Gimnasio en Costa Rica",
    description:
      "Plan personalizado, clases guiadas y seguimiento real. Empieza hoy.",
    type: "website",
    locale: "es_CR",
    siteName: "Force Extreme",
  },
  twitter: {
    card: "summary",
    title: "Force Extreme | Gimnasio en Costa Rica",
    description: "Clases de Fuerza, HIIT, Funcional e Iniciación. ¡Reserva tu lugar!",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <BootstrapClient />
        {children}
      </body>
    </html>
  );
}