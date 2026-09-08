import type { Metadata } from "next";
import { ManageBookingClient } from "./ManageBookingClient";

export const metadata: Metadata = {
  title: "Gestionar su reserva",
  description:
    "Consulte el estado de su traslado con el número de reserva y el email de compra.",
};

export default function GestionarReservaPage() {
  return <ManageBookingClient />;
}
