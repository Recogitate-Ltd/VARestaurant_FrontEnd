"use client";

import { ChevronRight, Truck } from "lucide-react";
import Link from "next/link";
import React from "react";
import BottleImage from "@/components/BottleImage";
import RequestFineWine from "@/components/RequestFineWine";
import { Badge } from "@/components/ui";
import { typeColour } from "@/lib/format";
import type { FineWine, FineWineCard as Card } from "@/lib/types";

export function fineWineHref(card: Pick<Card, "key">, offer?: Pick<FineWine, "id">): string {
  return `/fine-and-rare/${encodeURIComponent(card.key)}${offer ? `?offer=${offer.id}` : ""}`;
}

/** "3-4 weeks" → "Delivery 3–4 weeks". */
export function deliveryText(wine: Pick<FineWine, "delivery_estimate">): string {
  return `Delivery ${wine.delivery_estimate.replace(/(\d)-(\d)/, "$1–$2")}`;
}

/** "2019", or "2006–2019" across several vintages. */
export function vintageRange(card: Pick<Card, "vintages">): string {
  const years = card.vintages.filter((v) => /^\d+$/.test(v)).map(Number);
  if (card.vintages.length === 1) return card.vintages[0];
  if (years.length === 0) return "NV";
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}

function summary(card: Card): string {
  const parts: string[] = [];
  if (card.vintages.length > 1) parts.push(`${card.vintages.length} vintages`);
  parts.push(card.formats.length === 1 ? card.formats[0] : `${card.formats.length} sizes`);
  return parts.join(" · ");
}

export default function FineWineCard({ card }: { card: Card }) {
  const href = fineWineHref(card);
  const colour = card.colour || "";
  const single = card.offers.length === 1 ? card.offers[0] : null;
  return (
    <article className="group flex flex-col rounded-2xl bg-surface shadow-card ring-1 ring-white/10 overflow-hidden transition-shadow hover:shadow-lift">
      <Link href={href} className="relative block bg-gradient-to-b from-[#202224] to-surface pt-4" aria-label={card.name}>
        <BottleImage
          src={card.image_url}
          alt={card.name}
          type={colour}
          className="h-48 sm:h-52 w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <Badge className="absolute left-3 top-3 bg-gold/15 text-gold ring-1 ring-gold/40">Fine &amp; Rare</Badge>
        <span className="absolute right-3 top-3 font-display text-[18px] font-medium text-gold">{vintageRange(card)}</span>
      </Link>
      <div className="flex flex-1 flex-col p-4 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-ink-faint">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: typeColour(colour) }} />
          <span className="truncate">{[colour, card.region || card.country].filter(Boolean).join(" · ")}</span>
        </div>
        <Link href={href} className="mt-1.5">
          <h3 className="font-display text-[19px] leading-[1.15] font-medium text-ink group-hover:text-gold line-clamp-2">
            {card.name}
          </h3>
        </Link>
        <p className="mt-1 text-[12px] text-ink-soft line-clamp-1">
          {[card.producer, summary(card)].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-auto pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] text-ink-faint">
            <Truck className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
            {deliveryText(card)} · price on request
          </p>
          {single ? (
            <RequestFineWine wine={single} />
          ) : (
            <Link
              href={href}
              className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-gold text-[13px] text-gold hover:bg-gold/10 transition-colors"
            >
              Choose vintage &amp; request
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
