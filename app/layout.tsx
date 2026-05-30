import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./global.css";
import BootstrapClient from "../components/BootstrapClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Force Extreme | Gimnasio en Costa Rica",
    template: "%s | Force Extreme",
  },
  description:
    "Entrena con estructura, técnica y acompañamiento real. Clases de Fuerza, HIIT, Funcional e Iniciación. Reserva tu lugar hoy.",
  applicationName: "Force Extreme",
  keywords: ["gimnasio", "Costa Rica", "fuerza", "HIIT", "funcional", "entrenamiento", "clases", "fitness"],
  authors: [{ name: "Force Extreme" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Force Extreme | Gimnasio en Costa Rica",
    description:
      "Plan personalizado, clases guiadas y seguimiento real. Empieza hoy.",
    url: siteUrl,
    type: "website",
    locale: "es_CR",
    siteName: "Force Extreme",
  },
  twitter: {
    card: "summary",
    title: "Force Extreme | Gimnasio en Costa Rica",
    description: "Clases de Fuerza, HIIT, Funcional e Iniciación. ¡Reserva tu lugar!",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  width: "device-width",
  initialScale: 1,
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