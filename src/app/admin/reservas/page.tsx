import { Suspense } from "react";
import { AdminReservasClient } from "./ReservasClient";

export default function AdminReservasPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Cargando reservas…</p>}>
      <AdminReservasClient />
    </Suspense>
  );
}
