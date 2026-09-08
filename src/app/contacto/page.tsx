import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacte con Lanzarote Travels para dudas sobre traslados privados al aeropuerto de Lanzarote. Atención 24/7.",
};

export default function ContactoPage() {
  return <ContactForm />;
}
