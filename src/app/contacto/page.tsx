import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { getSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.seoContactTitle || "Contacto",
    description:
      settings.seoContactDescription ||
      "Contacte con Lanzarote Travels para dudas sobre traslados privados al aeropuerto de Lanzarote.",
  };
}

export default async function ContactoPage() {
  const settings = await getSettings();
  return <ContactForm intro={settings.contactIntro} />;
}
