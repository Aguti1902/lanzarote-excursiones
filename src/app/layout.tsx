import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AIChat } from "@/components/AIChat";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Lanzarote Travels - Traslados privados aeropuerto Lanzarote",
    template: "%s | Lanzarote Travels",
  },
  description:
    "Traslados privados desde y hacia el aeropuerto de Lanzarote. Recogida en terminal con cartel, seguimiento de vuelos y tarifa fija por vehículo.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${manrope.variable} ${fraunces.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AIChat />
      </body>
    </html>
  );
}
