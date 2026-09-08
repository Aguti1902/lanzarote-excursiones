import type { Metadata } from "next";
import { ManageBookingClient } from "./ManageBookingClient";
import { getSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.seoManageTitle || "Gestionar su reserva",
    description:
      settings.seoManageDescription ||
      "Consulte el estado de su traslado, descargue el voucher o cancele con devolución.",
  };
}

export default function GestionarReservaPage() {
  return <ManageBookingClient />;
}
