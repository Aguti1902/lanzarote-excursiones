"use client";

import { FormEvent, useEffect, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";

const inputClass =
  "w-full rounded-lg border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export default function ContactoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [contactPhone, setContactPhone] = useState("+34 600 000 000");
  const [contactEmail, setContactEmail] = useState("hola@lanzarotetravels.com");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.phone) setContactPhone(d.settings.phone);
        if (d.settings?.email) setContactEmail(d.settings.email);
      })
      .catch(() => undefined);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setOk(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        image="/images/heroes/about.jpg"
        title="Contacto"
        subtitle="Dudas sobre horarios, destinos o una reserva ya hecha."
        compact
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Escríbenos</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">Nombre</label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Email</label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Teléfono</label>
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Mensaje</label>
              <textarea
                className={`${inputClass} min-h-[140px]`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-coral">{error}</p>}
            {ok && (
              <p className="text-sm text-success">
                Mensaje enviado. Te responderemos pronto.
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-ocean px-6 py-3 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
            >
              {loading ? "Enviando…" : "Enviar mensaje"}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <a
            href={`tel:${contactPhone.replace(/\s/g, "")}`}
            className="flex items-center gap-3 rounded-xl bg-surface p-5 ring-1 ring-sand-line"
          >
            <Phone className="h-5 w-5 text-ocean" />
            <div>
              <p className="text-xs text-ink-muted">Teléfono</p>
              <p className="font-semibold">{contactPhone}</p>
            </div>
          </a>
          <a
            href={`mailto:${contactEmail}`}
            className="flex items-center gap-3 rounded-xl bg-surface p-5 ring-1 ring-sand-line"
          >
            <Mail className="h-5 w-5 text-ocean" />
            <div>
              <p className="text-xs text-ink-muted">Email</p>
              <p className="font-semibold">{contactEmail}</p>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}
