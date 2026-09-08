import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { TransferBookingForm } from "@/components/TransferBookingForm";
import { FaqSection } from "@/components/FaqSection";
import { getSettings, getTransfersData } from "@/lib/content";
import { formatPrice } from "@/lib/format";
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

  const chips = [
    "Aeropuerto al hotel",
    "Hotel al aeropuerto",
    "Ida y Vuelta",
  ];

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
      <PageHero
        image={settings.transferHeroImage}
        title="Traslados al aeropuerto de Lanzarote"
        subtitle={settings.transferIntro}
      />

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {chips.map((label) => (
            <div
              key={label}
              className="rounded-lg bg-ocean px-5 py-4 text-center text-sm font-bold text-white"
            >
              {label}
            </div>
          ))}
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {transfers.highlights.map((h) => (
            <li
              key={h}
              className="flex items-start gap-2 rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-sand-line"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
              {h}
            </li>
          ))}
        </ul>

        <div className="mt-12 overflow-hidden rounded-lg bg-white ring-1 ring-sand-line">
          <div className="border-b border-sand-line bg-sky-soft px-4 py-3">
            <h2 className="text-xl font-bold text-ink">
              Traslados privados desde y hacia el aeropuerto de Lanzarote
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-sand-line text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Destino</th>
                  <th className="px-4 py-3 font-medium">Duración</th>
                  <th className="px-4 py-3 font-medium">Ida</th>
                  <th className="px-4 py-3 font-medium">Ida y vuelta</th>
                </tr>
              </thead>
              <tbody>
                {transfers.destinations.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-sand-line last:border-0"
                  >
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      {d.name}
                    </td>
                    <td className="px-4 py-3.5 text-ink-muted">{d.duration}</td>
                    <td className="px-4 py-3.5 font-medium text-ocean-deep">
                      {formatPrice(d.priceOneWay)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ocean-deep">
                      {formatPrice(d.priceReturn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12" id="reservar">
          <TransferBookingForm destinations={transfers.destinations} />
        </div>
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
