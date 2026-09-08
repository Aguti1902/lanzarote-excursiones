"use client";

import type { FaqItem } from "@/lib/faqs";

export function FaqSection({
  title = "Preguntas frecuentes",
  items,
}: {
  title?: string;
  items: FaqItem[];
}) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      <div className="mt-8 space-y-3">
        {items.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-xl bg-white p-4 ring-1 ring-sand-line open:ring-ocean/30"
          >
            <summary className="cursor-pointer list-none font-semibold text-ink marker:content-none">
              <span className="flex items-center justify-between gap-3">
                {faq.question}
                <span className="text-ocean transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
