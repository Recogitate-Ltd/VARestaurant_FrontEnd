"use client";

import { Truck } from "lucide-react";
import Link from "next/link";
import React from "react";
import BottleImage from "@/components/BottleImage";
import RequestFineWine from "@/components/RequestFineWine";
import { Badge } from "@/components/ui";
import { typeColour } from "@/lib/format";
import type { FineWine } from "@/lib/types";

export function fineWineHref(wine: Pick<FineWine, "id">): string {
  return `/fine-and-rare/${wine.id}`;
}

/** "3-4 weeks" → "3–4 weeks". */
export function deliveryText(wine: Pick<FineWine, "delivery_estimate">): string {
  return `Delivery ${wine.delivery_estimate.replace(/(\d)-(\d)/, "$1–$2")}`;
}

export default function FineWineCard({ wine }: { wine: FineWine }) {
  const href = fineWineHref(wine);
  const colour = wine.colour || "";
  return (
    <article className="group flex flex-col rounded-2xl bg-surface shadow-card ring-1 ring-white/10 overflow-hidden transition-shadow hover:shadow-lift">
      <Link href={href} className="relative block bg-gradient-to-b from-[#202224] to-surface pt-4" aria-label={wine.name}>
        <BottleImage
          src={wine.image_url}
          alt={wine.name}
          type={colour}
          className="h-48 sm:h-52 w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <Badge className="absolute left-3 top-3 bg-gold/15 text-gold ring-1 ring-gold/40">Fine &amp; Rare</Badge>
        {wine.vintage && (
          <span className="absolute right-3 top-3 font-display text-[18px] font-medium text-gold">{wine.vintage}</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-ink-faint">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: typeColour(colour) }} />
          <span className="truncate">{[colour, wine.region || wine.country].filter(Boolean).join(" · ")}</span>
        </div>
        <Link href={href} className="mt-1.5">
          <h3 className="font-display text-[19px] leading-[1.15] font-medium text-ink group-hover:text-gold line-clamp-2">
            {wine.name}
          </h3>
        </Link>
        <p className="mt-1 text-[12px] text-ink-soft line-clamp-1">
          {[wine.producer, wine.format_label].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-auto pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] text-ink-faint">
            <Truck className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
            {deliveryText(wine)} · price on request
          </p>
          <RequestFineWine wine={wine} />
        </div>
      </div>
    </article>
  );
}
