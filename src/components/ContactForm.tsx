"use client";

import { FormEvent, useEffect, useState } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";

const inputClass =
  "w-full rounded-lg border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export function ContactForm({ intro }: { intro?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [contactPhone, setContactPhone] = useState("+34 600 000 000");
  const [contactEmail, setContactEmail] = useState("hola@lanzarotetravels.com");
  const [whatsapp, setWhatsapp] = useState("");
  const [hours, setHours] = useState("Contacto 24 / 7");
  const [address, setAddress] = useState("Lanzarote, Islas Canarias");
  const [introText, setIntroText] = useState(intro || "");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.phone) setContactPhone(d.settings.phone);
        if (d.settings?.email) setContactEmail(d.settings.email);
        if (d.settings?.whatsapp) setWhatsapp(d.settings.whatsapp);
        if (d.settings?.hours) setHours(d.settings.hours);
        if (d.settings?.contactAddress || d.settings?.companyAddress) {
          setAddress(
            d.settings.contactAddress || d.settings.companyAddress
          );
        }
        if (d.settings?.contactIntro && !intro) {
          setIntroText(d.settings.contactIntro);
        }
      })
      .catch(() => undefined);
  }, [intro]);

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

  const waDigits = (whatsapp || contactPhone).replace(/\D/g, "");

  return (
    <>
      <PageHero
        image="/images/heroes/about.jpg"
        title="¿Cómo podemos ayudarle?"
        subtitle={
          introText ||
          "Estamos para resolver todas sus dudas. Contacto 24 / 7."
        }
        compact
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6">
        <div>
          <h2 className="font-display text-2xl text-ink">
            Formulario de contacto
          </h2>
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
                Mensaje enviado. Le contactaremos lo antes posible.
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

        <div>
          <h2 className="font-display text-2xl text-ink">
            Información de contacto
          </h2>
          <ul className="mt-6 space-y-4 text-sm text-ink-muted">
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-ocean" />
              <a
                href={`tel:${contactPhone.replace(/\s/g, "")}`}
                className="hover:text-ocean"
              >
                {contactPhone}
              </a>
            </li>
            {waDigits && (
              <li className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 text-ocean" />
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-ocean"
                >
                  WhatsApp {whatsapp || contactPhone}
                </a>
              </li>
            )}
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-ocean" />
              <a href={`mailto:${contactEmail}`} className="hover:text-ocean">
                {contactEmail}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 text-ocean" />
              <span>{hours}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-ocean" />
              <span className="whitespace-pre-line">{address}</span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
