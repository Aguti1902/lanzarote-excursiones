import { promises as fs } from "fs";
import path from "path";
import type {
  SiteSettings,
  TransferDestination,
  TransfersData,
} from "@/types";

const dataDir = path.join(process.cwd(), "src/data");

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(dataDir, file), "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.writeFile(
    path.join(dataDir, file),
    JSON.stringify(data, null, 2) + "\n",
    "utf-8"
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ── Transfers ── */

export async function getTransfersData(): Promise<TransfersData> {
  return readJson<TransfersData>("transfers.json");
}

export async function getTransferDestinations(): Promise<TransferDestination[]> {
  return (await getTransfersData()).destinations;
}

export async function saveTransfersData(data: TransfersData): Promise<void> {
  await writeJson("transfers.json", data);
}

export async function upsertTransfer(
  dest: TransferDestination
): Promise<TransferDestination> {
  const data = await getTransfersData();
  const idx = data.destinations.findIndex((d) => d.id === dest.id);
  if (idx === -1) data.destinations.push(dest);
  else data.destinations[idx] = dest;
  await saveTransfersData(data);
  return dest;
}

export async function createTransfer(
  input: Partial<TransferDestination> & Pick<TransferDestination, "name">
): Promise<TransferDestination> {
  const data = await getTransfersData();
  const baseSlug = slugify(input.slug || input.name);
  let slug = baseSlug;
  let n = 2;
  while (data.destinations.some((d) => d.slug === slug)) {
    slug = `${baseSlug}-${n++}`;
  }
  const dest: TransferDestination = {
    id: slug,
    name: input.name,
    slug,
    priceOneWay: input.priceOneWay ?? 0,
    priceReturn: input.priceReturn ?? 0,
    duration: input.duration || "30 min",
    distance: input.distance || "",
  };
  data.destinations.push(dest);
  await saveTransfersData(data);
  return dest;
}

export async function deleteTransfer(id: string): Promise<boolean> {
  const data = await getTransfersData();
  const next = data.destinations.filter((d) => d.id !== id);
  if (next.length === data.destinations.length) return false;
  data.destinations = next;
  await saveTransfersData(data);
  return true;
}

export async function updateTransferHighlights(
  highlights: string[]
): Promise<string[]> {
  const data = await getTransfersData();
  data.highlights = highlights;
  await saveTransfersData(data);
  return highlights;
}

/* ── Settings ── */

const defaultSettings: SiteSettings = {
  brandName: "Lanzarote Travels",
  tagline: "Traslados privados",
  phone: "+34 600 000 000",
  email: "hola@lanzarotetravels.com",
  hours: "Contacto 24 / 7",
  homeHeadline: "Traslados privados en Lanzarote",
  homeSubheadline:
    "Del aeropuerto a tu hotel con chófer privado. Te esperamos en llegadas con cartel.",
  homeHeroImage: "/images/heroes/transfer.jpg",
  homeExtraText: "",
  homeFeatures: "",
  homeCtaTitle: "¿Listo para llegar sin estrés?",
  homeCtaText:
    "Reserva tu traslado privado en minutos. Cancelación gratuita hasta 48 horas antes.",
  homeFaqs: "",
  aboutTitle: "Traslados con criterio local",
  aboutLead:
    "Somos una empresa local especializada en traslados privados aeropuerto ↔ hotel en Lanzarote.",
  aboutText: "",
  aboutImage: "/images/heroes/about.jpg",
  aboutImageSecondary: "/images/heroes/about-2.jpg",
  aboutValues: "",
  aboutPromise: "",
  aboutFaqs: "",
  transferIntro:
    "Disfrute más de la isla y menos del aeropuerto, reservando un traslado privado a su hotel. Nuestro chófer le esperará en la terminal de llegadas.",
  transferHeroImage: "/images/heroes/transfer.jpg",
  transferFaqs: "",
  contactAddress: "Lanzarote, Islas Canarias",
  contactIntro: "",
  seoTitle: "Lanzarote Travels - Traslados privados aeropuerto Lanzarote",
  seoDescription:
    "Traslados privados desde y hacia el aeropuerto de Lanzarote. Recogida en terminal con cartel, seguimiento de vuelos y tarifa fija por vehículo.",
  companyLegalName: "Lanzarote Travels S.L.",
  companyTaxId: "",
  companyAddress: "Lanzarote, Islas Canarias",
  taxRate: 0,
};

export async function getSettings(): Promise<SiteSettings> {
  const stored = await readJson<Partial<SiteSettings>>("settings.json");
  return { ...defaultSettings, ...stored };
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await writeJson("settings.json", settings);
}
