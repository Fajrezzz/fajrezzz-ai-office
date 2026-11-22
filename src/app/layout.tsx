import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FAJREZZZ AI OFFICE — Cyberpunk 3D Virtual Office",
  description:
    "Fondasi aplikasi web Virtual Office 3D interaktif bergaya cyberpunk futuristik dengan React Three Fiber, Agent Management, Task Manager, dan Live Activity.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-[#030712] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
