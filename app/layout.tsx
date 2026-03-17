import type { Metadata } from "next";
import type { ReactNode } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./global.css";
import BootstrapClient from "../components/BootstrapClient";

export const metadata: Metadata = {
  title: "Force Extreme | Gimnasio",
  description: "Landing page de Force Extreme",
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