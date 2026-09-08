import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Plane, Shield, Clock } from "lucide-react";
import { TransferBookingForm } from "@/components/TransferBookingForm";
import { getSettings, getTransfersData } from "@/lib/content";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Traslados privados aeropuerto Lanzarote",
  description:
    "Reserva tu traslado privado desde el aeropuerto de Lanzarote a Playa Blanca, Puerto del Carmen, Costa Teguise y más.",
};

export default async function HomePage() {
  const [settings, transfers] = await Promise.all([
    getSettings(),
    getTransfersData(),
  ]);

  const featured = transfers.destinations.slice(0, 6);

  return (
    <>
      <section className="relative isolate min-h-[88vh] overflow-hidden">
        <Image
          src={settings.homeHeroImage || settings.transferHeroImage}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-deep/85 via-bg-deep/55 to-bg-deep/25" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-32 md:px-6 md:pb-24">
          <p className="text-sm font-semibold tracking-[0.2em] text-sky-mist uppercase">
            {settings.brandName}
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl text-white md:text-6xl">
            {settings.homeHeadline}
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">
            {settings.homeSubheadline}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/traslados"
              className="inline-flex items-center gap-2 rounded-md bg-ocean px-6 py-3 text-sm font-semibold text-white hover:bg-ocean-deep"
            >
              Reservar traslado
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/gestionar-reserva"
              className="inline-flex items-center rounded-md bg-white/15 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/25"
            >
              Gestionar reserva
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Plane,
              title: "Recogida en terminal",
              text: "Te esperamos en llegadas con cartel y asistencia con el equipaje.",
            },
            {
              icon: Clock,
              title: "Seguimiento de vuelos",
              text: "Adaptamos la recogida si tu vuelo se retrasa o adelanta.",
            },
            {
              icon: Shield,
              title: "Precio cerrado",
              text: "Tarifa por vehículo, sin sorpresas ni suplementos de noche.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl bg-surface p-6 ring-1 ring-sand-line">
              <item.icon className="h-6 w-6 text-ocean" />
              <h2 className="mt-4 font-display text-xl text-ink">{item.title}</h2>
              <p className="mt-2 text-sm text-ink-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-sand-line bg-sky-soft/50 py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-ink">Destinos populares</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Tarifas orientativas ida · vehículo privado
              </p>
            </div>
            <Link
              href="/traslados"
              className="text-sm font-semibold text-ocean hover:underline"
            >
              Ver todos y reservar
            </Link>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-4 ring-1 ring-sand-line"
              >
                <div>
                  <p className="font-semibold text-ink">{d.name}</p>
                  <p className="text-xs text-ink-muted">{d.duration}</p>
                </div>
                <p className="font-bold text-ocean-deep">
                  {formatPrice(d.priceOneWay)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <ul className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {transfers.highlights.slice(0, 6).map((h) => (
            <li
              key={h}
              className="flex items-start gap-2 text-sm text-ink-muted"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
              {h}
            </li>
          ))}
        </ul>
        <TransferBookingForm destinations={transfers.destinations} />
      </section>
    </>
  );
}
