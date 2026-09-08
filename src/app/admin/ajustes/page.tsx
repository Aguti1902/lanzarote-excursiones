"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/types";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";
import { ImageField } from "@/components/admin/ImageField";

const empty: SiteSettings = {
  brandName: "",
  tagline: "",
  phone: "",
  email: "",
  hours: "",
  homeHeadline: "",
  homeSubheadline: "",
  homeHeroImage: "",
  homeExtraText: "",
  homeFeatures: "",
  homeCtaTitle: "",
  homeCtaText: "",
  homeFaqs: "",
  aboutTitle: "",
  aboutLead: "",
  aboutText: "",
  aboutImage: "",
  aboutImageSecondary: "",
  aboutValues: "",
  aboutPromise: "",
  aboutFaqs: "",
  transferIntro: "",
  transferHeroImage: "",
  transferFaqs: "",
  contactAddress: "",
  contactIntro: "",
  seoTitle: "",
  seoDescription: "",
  seoHomeTitle: "",
  seoHomeDescription: "",
  seoAboutTitle: "",
  seoAboutDescription: "",
  seoTransfersTitle: "",
  seoTransfersDescription: "",
  seoContactTitle: "",
  seoContactDescription: "",
  seoManageTitle: "",
  seoManageDescription: "",
  companyLegalName: "",
  companyTaxId: "",
  companyAddress: "",
  companyAgencyId: "",
  taxRate: 7,
};

export default function AdminAjustesPage() {
  const [settings, setSettings] = useState<SiteSettings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings({ ...empty, ...d.settings });
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Error al guardar");
      return;
    }
    setMessage("Ajustes guardados. Se reflejan en la web pública.");
  }

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <p className="text-ink-muted">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Ajustes de la web</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Textos, SEO, FAQs, imágenes y datos fiscales. Todo sincronizado con la
          web pública.
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line md:grid-cols-2">
          <h2 className="font-display text-xl md:col-span-2">Contacto y marca</h2>
          <Field label="Nombre de marca">
            <input
              className={adminInput}
              value={settings.brandName}
              onChange={(e) => set("brandName", e.target.value)}
            />
          </Field>
          <Field label="Eslogan corto">
            <input
              className={adminInput}
              value={settings.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </Field>
          <Field label="Teléfono">
            <input
              className={adminInput}
              value={settings.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={adminInput}
              value={settings.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Horario">
            <input
              className={adminInput}
              value={settings.hours}
              onChange={(e) => set("hours", e.target.value)}
            />
          </Field>
          <Field label="Dirección (contacto)">
            <input
              className={adminInput}
              value={settings.contactAddress || ""}
              onChange={(e) => set("contactAddress", e.target.value)}
            />
          </Field>
          <Field label="Intro contacto" className="md:col-span-2">
            <textarea
              className={adminTextarea}
              value={settings.contactIntro || ""}
              onChange={(e) => set("contactIntro", e.target.value)}
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">SEO por página</h2>
          <p className="text-xs text-ink-muted">
            Si deja un campo vacío, se usa el SEO general o el título por
            defecto.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SEO general · título">
              <input
                className={adminInput}
                value={settings.seoTitle || ""}
                onChange={(e) => set("seoTitle", e.target.value)}
              />
            </Field>
            <Field label="SEO general · description">
              <textarea
                className={adminTextarea}
                value={settings.seoDescription || ""}
                onChange={(e) => set("seoDescription", e.target.value)}
              />
            </Field>
            <Field label="Inicio · título">
              <input
                className={adminInput}
                value={settings.seoHomeTitle || ""}
                onChange={(e) => set("seoHomeTitle", e.target.value)}
              />
            </Field>
            <Field label="Inicio · description">
              <textarea
                className={adminTextarea}
                value={settings.seoHomeDescription || ""}
                onChange={(e) => set("seoHomeDescription", e.target.value)}
              />
            </Field>
            <Field label="Sobre nosotros · título">
              <input
                className={adminInput}
                value={settings.seoAboutTitle || ""}
                onChange={(e) => set("seoAboutTitle", e.target.value)}
              />
            </Field>
            <Field label="Sobre nosotros · description">
              <textarea
                className={adminTextarea}
                value={settings.seoAboutDescription || ""}
                onChange={(e) => set("seoAboutDescription", e.target.value)}
              />
            </Field>
            <Field label="Traslados · título">
              <input
                className={adminInput}
                value={settings.seoTransfersTitle || ""}
                onChange={(e) => set("seoTransfersTitle", e.target.value)}
              />
            </Field>
            <Field label="Traslados · description">
              <textarea
                className={adminTextarea}
                value={settings.seoTransfersDescription || ""}
                onChange={(e) => set("seoTransfersDescription", e.target.value)}
              />
            </Field>
            <Field label="Contacto · título">
              <input
                className={adminInput}
                value={settings.seoContactTitle || ""}
                onChange={(e) => set("seoContactTitle", e.target.value)}
              />
            </Field>
            <Field label="Contacto · description">
              <textarea
                className={adminTextarea}
                value={settings.seoContactDescription || ""}
                onChange={(e) => set("seoContactDescription", e.target.value)}
              />
            </Field>
            <Field label="Gestionar reserva · título">
              <input
                className={adminInput}
                value={settings.seoManageTitle || ""}
                onChange={(e) => set("seoManageTitle", e.target.value)}
              />
            </Field>
            <Field label="Gestionar reserva · description">
              <textarea
                className={adminTextarea}
                value={settings.seoManageDescription || ""}
                onChange={(e) => set("seoManageDescription", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Inicio</h2>
          <Field label="Titular">
            <input
              className={adminInput}
              value={settings.homeHeadline}
              onChange={(e) => set("homeHeadline", e.target.value)}
            />
          </Field>
          <Field label="Subtítulo">
            <textarea
              className={adminTextarea}
              value={settings.homeSubheadline}
              onChange={(e) => set("homeSubheadline", e.target.value)}
            />
          </Field>
          <Field label="Texto extra (párrafos con línea en blanco)">
            <textarea
              className={`${adminTextarea} min-h-[120px]`}
              value={settings.homeExtraText || ""}
              onChange={(e) => set("homeExtraText", e.target.value)}
            />
          </Field>
          <Field label="Bloques destacados (Título || Texto, uno por línea)">
            <textarea
              className={`${adminTextarea} min-h-[120px]`}
              value={settings.homeFeatures || ""}
              onChange={(e) => set("homeFeatures", e.target.value)}
            />
          </Field>
          <Field label="CTA · título">
            <input
              className={adminInput}
              value={settings.homeCtaTitle || ""}
              onChange={(e) => set("homeCtaTitle", e.target.value)}
            />
          </Field>
          <Field label="CTA · texto">
            <textarea
              className={adminTextarea}
              value={settings.homeCtaText || ""}
              onChange={(e) => set("homeCtaText", e.target.value)}
            />
          </Field>
          <Field label="FAQs inicio (Pregunta || Respuesta, una por línea)">
            <textarea
              className={`${adminTextarea} min-h-[140px]`}
              value={settings.homeFaqs || ""}
              onChange={(e) => set("homeFaqs", e.target.value)}
            />
          </Field>
          <ImageField
            label="Imagen hero inicio"
            value={settings.homeHeroImage}
            onChange={(url) => set("homeHeroImage", url)}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Sobre nosotros</h2>
          <Field label="Título">
            <input
              className={adminInput}
              value={settings.aboutTitle}
              onChange={(e) => set("aboutTitle", e.target.value)}
            />
          </Field>
          <Field label="Entradilla">
            <textarea
              className={adminTextarea}
              value={settings.aboutLead}
              onChange={(e) => set("aboutLead", e.target.value)}
            />
          </Field>
          <Field label="Texto completo (párrafos con línea en blanco)">
            <textarea
              className={`${adminTextarea} min-h-[200px]`}
              value={settings.aboutText}
              onChange={(e) => set("aboutText", e.target.value)}
            />
          </Field>
          <Field label="Valores (uno por línea)">
            <textarea
              className={adminTextarea}
              value={settings.aboutValues}
              onChange={(e) => set("aboutValues", e.target.value)}
            />
          </Field>
          <Field label="Promesa">
            <textarea
              className={adminTextarea}
              value={settings.aboutPromise}
              onChange={(e) => set("aboutPromise", e.target.value)}
            />
          </Field>
          <Field label="FAQs sobre nosotros (Pregunta || Respuesta)">
            <textarea
              className={`${adminTextarea} min-h-[120px]`}
              value={settings.aboutFaqs || ""}
              onChange={(e) => set("aboutFaqs", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <ImageField
              label="Imagen principal"
              value={settings.aboutImage}
              onChange={(url) => set("aboutImage", url)}
            />
            <ImageField
              label="Imagen secundaria"
              value={settings.aboutImageSecondary}
              onChange={(url) => set("aboutImageSecondary", url)}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Traslados</h2>
          <Field label="Texto introductorio">
            <textarea
              className={adminTextarea}
              value={settings.transferIntro}
              onChange={(e) => set("transferIntro", e.target.value)}
            />
          </Field>
          <Field label="FAQs traslados (Pregunta || Respuesta)">
            <textarea
              className={`${adminTextarea} min-h-[140px]`}
              value={settings.transferFaqs || ""}
              onChange={(e) => set("transferFaqs", e.target.value)}
            />
          </Field>
          <ImageField
            label="Imagen hero traslados"
            value={settings.transferHeroImage}
            onChange={(url) => set("transferHeroImage", url)}
          />
        </section>

        <section className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line md:grid-cols-2">
          <h2 className="font-display text-xl md:col-span-2">
            Datos fiscales (facturas / voucher)
          </h2>
          <Field label="Razón social">
            <input
              className={adminInput}
              value={settings.companyLegalName || ""}
              onChange={(e) => set("companyLegalName", e.target.value)}
            />
          </Field>
          <Field label="NIF / CIF">
            <input
              className={adminInput}
              value={settings.companyTaxId || ""}
              onChange={(e) => set("companyTaxId", e.target.value)}
            />
          </Field>
          <Field label="Dirección fiscal" className="md:col-span-2">
            <input
              className={adminInput}
              value={settings.companyAddress || ""}
              onChange={(e) => set("companyAddress", e.target.value)}
            />
          </Field>
          <Field label="Agencia Nº (licencia)">
            <input
              className={adminInput}
              value={settings.companyAgencyId || ""}
              onChange={(e) => set("companyAgencyId", e.target.value)}
              placeholder="Ej. I-AV-0002407.1"
            />
          </Field>
          <Field label="% IGIC (Canarias)">
            <input
              type="number"
              min={0}
              max={30}
              step={0.1}
              className={adminInput}
              value={settings.taxRate ?? 7}
              onChange={(e) => set("taxRate", Number(e.target.value))}
            />
          </Field>
          <p className="md:col-span-2 text-xs text-ink-muted">
            Los precios de reserva se entienden con IGIC incluido. En la factura
            se desglosa base imponible + IGIC (por defecto 7%).
          </p>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-ocean px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar ajustes"}
        </button>
      </form>
    </div>
  );
}
