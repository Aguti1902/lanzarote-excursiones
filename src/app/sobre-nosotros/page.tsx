import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock, Plane, Shield } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { FaqSection } from "@/components/FaqSection";
import { getSettings } from "@/lib/content";
import { parseFaqs } from "@/lib/faqs";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.seoAboutTitle || "Sobre nosotros",
    description:
      settings.seoAboutDescription ||
      "Conoce Lanzarote Travels: traslados privados aeropuerto ↔ hotel con chófer local.",
  };
}

export default async function SobreNosotrosPage() {
  const settings = await getSettings();
  const paragraphs = settings.aboutText.split("\n\n").filter(Boolean);
  const values = settings.aboutValues
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
  const faqs = parseFaqs(settings.aboutFaqs);

  return (
    <>
      <PageHero
        image={settings.aboutImage}
        eyebrow="Quiénes somos"
        title={settings.aboutTitle}
        subtitle={settings.aboutLead}
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
        <div>
          <p className="font-display text-3xl leading-snug text-ink md:text-4xl">
            {paragraphs[0]}
          </p>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-muted">
            {paragraphs.slice(1).map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-sand-line md:aspect-[5/6]">
          <Image
            src={settings.aboutImageSecondary}
            alt="Costa y paisaje de Lanzarote"
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="border-y border-sand-line bg-sky-soft/70 py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="font-display text-3xl text-ink md:text-4xl">
            Lo que nos define
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <li
                key={value}
                className="flex items-start gap-3 rounded-2xl bg-white p-5 ring-1 ring-sand-line"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ocean" />
                <span className="text-sm font-medium text-ink">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Plane,
              title: "Recogida en terminal",
              text: "Te esperamos en llegadas con cartel y ayuda con el equipaje.",
            },
            {
              icon: Clock,
              title: "Seguimiento de vuelos",
              text: "Si el vuelo se retrasa, adaptamos la recogida sin coste extra.",
            },
            {
              icon: Shield,
              title: "Precio cerrado",
              text: "Tarifa por vehículo, formas de pago claras y sin sorpresas.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-surface p-6 ring-1 ring-sand-line"
            >
              <item.icon className="h-7 w-7 text-ocean" />
              <h3 className="mt-4 font-display text-xl">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl bg-bg-deep text-white md:grid md:grid-cols-2">
          <div className="relative min-h-[260px]">
            <Image
              src={settings.aboutImage}
              alt="Paisaje de Lanzarote"
              fill
              className="object-cover opacity-80"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col justify-center p-8 md:p-10">
            <h2 className="font-display text-3xl">Nuestra promesa</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/80 md:text-base">
              {settings.aboutPromise}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/traslados"
                className="rounded-md bg-ocean px-5 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep"
              >
                Reservar traslado
              </Link>
              <Link
                href="/contacto"
                className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-sand-line bg-sky-soft/40">
        <FaqSection title="Preguntas frecuentes" items={faqs} />
      </div>
    </>
  );
}
