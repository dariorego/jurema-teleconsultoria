import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JUREMA — Teleconsultoria IMIP",
  description: "Plataforma de teleconsultoria médica via WhatsApp",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
