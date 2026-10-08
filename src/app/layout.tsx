import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "JeumalaCup 26 — Pendaftaran Jersey",
  description:
    "Sistem pendaftaran nama dan nomor punggung jersey untuk event JeumalaCup 26.",
  keywords: ["JeumalaCup", "Jersey", "Pendaftaran", "Sepak Bola"],
  authors: [{ name: "Alfiz Ilham" }],
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} font-sans antialiased bg-app-bg text-app-fg`}
      >
        {children}
      </body>
    </html>
  );
}
