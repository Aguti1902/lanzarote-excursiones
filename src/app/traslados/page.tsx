import type { Metadata } from "next";
import { FaqSection } from "@/components/FaqSection";
import { TransfersBookingSection } from "@/components/TransfersBookingSection";
import { getSettings, getTransfersData } from "@/lib/content";
import { parseFaqs } from "@/lib/faqs";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.seoTransfersTitle || "Traslados al aeropuerto de Lanzarote",
    description:
      settings.seoTransfersDescription ||
      "Traslados privados desde y hacia el aeropuerto de Lanzarote. Recogida en terminal con cartel, seguimiento de vuelos y tarifa fija por vehículo.",
  };
}

export default async function TrasladosPage() {
  const [transfers, settings] = await Promise.all([
    getTransfersData(),
    getSettings(),
  ]);

  const faqs = parseFaqs(settings.transferFaqs);
  const fallbackFaqs = [
    {
      question: "¿Dónde encontraré a mi chófer?",
      answer:
        "Le esperamos en la terminal de llegadas con un cartel con su nombre.",
    },
    {
      question: "¿Qué pasa si mi vuelo tiene un retraso?",
      answer:
        "Hacemos seguimiento de vuelos y adaptamos la recogida sin coste adicional.",
    },
    {
      question: "¿Cómo funciona la política de cancelación?",
      answer:
        "Cancelación gratuita hasta 48 horas antes del servicio. Puede cancelar desde Gestionar reserva.",
    },
  ];

  return (
    <>
      <section className="border-b border-sand-line bg-gradient-to-b from-sky-soft/60 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-12">
          <p className="text-xs font-bold tracking-[0.18em] text-ocean uppercase">
            Traslados
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            Traslados al aeropuerto de Lanzarote
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted md:text-base">
            {settings.transferIntro}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-12">
        <TransfersBookingSection
          destinations={transfers.destinations}
          highlights={transfers.highlights}
        />
      </section>

      <div className="border-t border-sand-line bg-sky-soft">
        <FaqSection
          title="Preguntas frecuentes sobre nuestros traslados en Lanzarote"
          items={faqs.length ? faqs : fallbackFaqs}
        />
      </div>
    </>
  );
}
