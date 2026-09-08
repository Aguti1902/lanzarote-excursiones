import { getSettings, getTransfersData } from "@/lib/content";
import { formatPrice } from "@/lib/format";

export type ChatMessage = { role: "user" | "assistant"; content: string };

async function buildContext(): Promise<string> {
  const [settings, transfers] = await Promise.all([
    getSettings(),
    getTransfersData(),
  ]);

  const destLines = transfers.destinations
    .map(
      (d) =>
        `- ${d.name}: ida ${formatPrice(d.priceOneWay)}, ida y vuelta ${formatPrice(d.priceReturn)} (${d.duration})`
    )
    .join("\n");

  return `Empresa: ${settings.brandName}
Teléfono: ${settings.phone}
Email: ${settings.email}
Horario: ${settings.hours}

Traslados privados aeropuerto ↔ hotel. Precio por vehículo (hasta 8 pasajeros).
Pagos: tarjeta (100%) o Bizum (100%) online. Sin cobro en efectivo.
Reserva en /traslados · Consulta en /gestionar-reserva · Contacto en /contacto

Destinos y tarifas:
${destLines}

Highlights:
${transfers.highlights.map((h) => `- ${h}`).join("\n")}
`;
}

function localAnswer(q: string, context: string): string | null {
  if (
    /hola|buenas|hey|hello|buenos dias|buenas tardes|saludos/.test(q) &&
    q.length < 40
  ) {
    return "¡Hola! Soy el asistente de Lanzarote Travels. ¿A qué destino necesitas el traslado desde el aeropuerto?";
  }

  if (/gracias|thank/.test(q)) {
    return "¡De nada! Si quieres, te ayudo a elegir destino o a reservar en /traslados.";
  }

  if (
    /traslad|aeropuerto|taxi|recogida|transfer|playa blanca|puerto del carmen|costa teguise|arrecife|puerto calero|precio|cuanto|cuesta|tarif|euro|€/.test(
      q
    )
  ) {
    const lines = context
      .split("\n")
      .filter((l) => l.startsWith("- ") && l.includes("ida"))
      .slice(0, 8)
      .join("\n");
    return `Estas son las tarifas orientativas (por vehículo):\n${lines}\n\nPuedes reservar en /traslados.`;
  }

  if (/pago|bizum|tarjeta|efectivo|cobro|deposito|10%/.test(q)) {
    return "Los traslados se pagan online al reservar: tarjeta (100%) o Bizum (100%). La factura se genera automáticamente.";
  }

  if (/cancel|reembol|anular/.test(q)) {
    return "Para cancelar o modificar, consulta tu localizador en /gestionar-reserva o escríbenos desde /contacto con tu número de reserva.";
  }

  if (/contacto|telefono|llamar|email|correo|whatsapp|horario/.test(q)) {
    return "Encontrarás teléfono y email en /contacto. También puedes dejarnos un mensaje desde esa página.";
  }

  if (/reserva|reservar|book|contratar/.test(q)) {
    return "Puedes reservar tu traslado en /traslados en menos de un minuto. Si ya tienes localizador, míralo en /gestionar-reserva.";
  }

  return null;
}

async function openAIReply(
  messages: ChatMessage[],
  context: string
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `Eres el asistente de reservas de Lanzarote Travels (solo traslados). Responde en español, breve y amable (máx. 120 palabras). Usa solo esta información. No inventes precios. Enlaces útiles: /traslados, /gestionar-reserva, /contacto.

${context}`,
          },
          ...messages.slice(-8),
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function answerChat(messages: ChatMessage[]): Promise<{
  reply: string;
  mode: "local" | "openai";
}> {
  const context = await buildContext();
  const last = messages[messages.length - 1]?.content || "";
  const q = last.toLowerCase();

  const ai = await openAIReply(messages, context);
  if (ai) return { reply: ai, mode: "openai" };

  const local = localAnswer(q, context);
  if (local) return { reply: local, mode: "local" };

  return {
    reply:
      "Puedo ayudarte con destinos, precios y formas de pago de traslados. Pregunta por un destino (p. ej. Playa Blanca) o reserva en /traslados.",
    mode: "local",
  };
}
