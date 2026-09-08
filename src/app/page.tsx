import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Plane,
  Shield,
  Clock,
  MapPin,
  Headphones,
} from "lucide-react";
import { TransferBookingForm } from "@/components/TransferBookingForm";
import { FaqSection } from "@/components/FaqSection";
import { getSettings, getTransfersData } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { parseFaqs, parseFeatures } from "@/lib/faqs";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title:
      settings.seoHomeTitle ||
      settings.seoTitle ||
      "Traslados privados aeropuerto Lanzarote",
    description:
      settings.seoHomeDescription ||
      settings.seoDescription ||
      "Traslados privados desde y hacia el aeropuerto de Lanzarote.",
  };
}

const featureIcons = [Plane, Clock, Shield, MapPin, Headphones, CheckCircle2];

export default async function HomePage() {
  const [settings, transfers] = await Promise.all([
    getSettings(),
    getTransfersData(),
  ]);

  const featured = transfers.destinations.slice(0, 6);
  const features = parseFeatures(settings.homeFeatures);
  const faqs = parseFaqs(settings.homeFaqs);
  const extraParagraphs = (settings.homeExtraText || "")
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const defaultFeatures = [
    {
      title: "Recogida en terminal",
      text: "Te esperamos en llegadas con cartel y asistencia con el equipaje.",
    },
    {
      title: "Seguimiento de vuelos",
      text: "Adaptamos la recogida si tu vuelo se retrasa o adelanta.",
    },
    {
      title: "Precio cerrado",
      text: "Tarifa por vehículo, sin sorpresas ni suplementos de noche.",
    },
  ];
  const showFeatures = features.length ? features : defaultFeatures;

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
              href="/traslados-aeropuerto-lanzarote"
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
          {showFeatures.slice(0, 6).map((item, i) => {
            const Icon = featureIcons[i % featureIcons.length];
            return (
              <div
                key={item.title}
                className="rounded-xl bg-surface p-6 ring-1 ring-sand-line"
              >
                <Icon className="h-6 w-6 text-ocean" />
                <h2 className="mt-4 font-display text-xl text-ink">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm text-ink-muted">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {extraParagraphs.length > 0 && (
        <section className="border-y border-sand-line bg-white py-14">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <h2 className="font-display text-3xl text-ink">
              Por qué reservar con nosotros
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-muted">
              {extraParagraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-y border-sand-line bg-sky-soft/50 py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-ink">
                Destinos populares
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Tarifas orientativas ida · vehículo privado
              </p>
            </div>
            <Link
              href="/traslados-aeropuerto-lanzarote"
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
        <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <h2 className="font-display text-3xl text-ink">
              Cómo funciona
            </h2>
            <ol className="mt-6 space-y-4 text-sm text-ink-muted">
              {[
                "Elige destino, trayecto y fecha en el formulario.",
                "Paga online con tarjeta o Bizum (precio cerrado).",
                "Recibe confirmación, factura y voucher al instante.",
                "El día del servicio, tu chófer te espera en terminal.",
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
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
          </div>
          <TransferBookingForm destinations={transfers.destinations} />
        </div>
      </section>

      {(settings.homeCtaTitle || settings.homeCtaText) && (
        <section className="bg-bg-deep py-14 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
            <h2 className="font-display text-3xl md:text-4xl">
              {settings.homeCtaTitle || "¿Listo para llegar sin estrés?"}
            </h2>
            {settings.homeCtaText && (
              <p className="mx-auto mt-4 max-w-2xl text-sm text-white/75 md:text-base">
                {settings.homeCtaText}
              </p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/traslados-aeropuerto-lanzarote"
                className="rounded-md bg-ocean px-6 py-3 text-sm font-semibold text-white hover:bg-ocean-deep"
              >
                Reservar ahora
              </Link>
              <Link
                href="/sobre-nosotros"
                className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white/10"
              >
                Sobre nosotros
              </Link>
            </div>
          </div>
        </section>
      )}

      <FaqSection title="Preguntas frecuentes" items={faqs} />
    </>
  );
}
