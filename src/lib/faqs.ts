export type FaqItem = { question: string; answer: string };
export type FeatureItem = { title: string; text: string };

/** Formato admin: una línea por ítem → `Pregunta || Respuesta` */
export function parseFaqs(raw?: string): FaqItem[] {
  if (!raw?.trim()) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("||");
      const question = (parts[0] || "").trim();
      const answer = parts.slice(1).join("||").trim();
      return { question, answer };
    })
    .filter((f) => f.question && f.answer);
}

/** Formato admin: `Título || Texto` por línea */
export function parseFeatures(raw?: string): FeatureItem[] {
  if (!raw?.trim()) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("||");
      const title = (parts[0] || "").trim();
      const text = parts.slice(1).join("||").trim();
      return { title, text };
    })
    .filter((f) => f.title && f.text);
}

export function faqsToRaw(faqs: FaqItem[]): string {
  return faqs.map((f) => `${f.question} || ${f.answer}`).join("\n");
}
