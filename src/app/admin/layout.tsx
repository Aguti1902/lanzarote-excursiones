"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bus,
  CalendarDays,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarDays },
  { href: "/admin/facturas", label: "Facturas", icon: FileText },
  { href: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/admin/traslados", label: "Traslados", icon: Bus },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    const ok = localStorage.getItem("lt_admin") === "1";
    if (!ok && !isLogin) {
      router.replace("/admin/login");
    } else {
      setReady(true);
    }
  }, [isLogin, router, pathname]);

  if (isLogin) return <>{children}</>;
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-ink-muted">
        Cargando panel…
      </div>
    );
  }

  function logout() {
    localStorage.removeItem("lt_admin");
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <aside className="hidden w-64 shrink-0 flex-col bg-header text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-display text-xl">Lanzarote Travels</p>
          <p className="mt-1 text-xs text-white/55">Panel de administración</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {nav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-white/15 font-semibold text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Ver web
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-sand-line bg-white px-4 py-3 md:hidden">
          <p className="font-semibold text-ink">Panel LT</p>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-ink-muted"
          >
            Salir
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-sand-line bg-white px-2 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${
                pathname.startsWith(item.href)
                  ? "bg-ocean/10 font-semibold text-ocean-deep"
                  : "text-ink-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
