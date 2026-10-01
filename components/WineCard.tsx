"use client";

import Link from "next/link";
import React from "react";
import AddToBasket from "@/components/AddToBasket";
import BottleImage from "@/components/BottleImage";
import { Badge } from "@/components/ui";
import { money, typeColour, typeLabel } from "@/lib/format";
import type { Wine } from "@/lib/types";

export default function WineCard({ wine }: { wine: Wine }) {
  const href = `/wines/${encodeURIComponent(wine.product_code)}`;
  return (
    <article className="group flex flex-col rounded-2xl bg-surface shadow-card ring-1 ring-white/10 overflow-hidden transition-shadow hover:shadow-lift">
      <Link href={href} className="relative block bg-gradient-to-b from-[#202224] to-surface pt-4" aria-label={wine.name}>
        <BottleImage
          src={wine.image_url}
          alt={wine.name}
          type={wine.wine_type}
          className="h-48 sm:h-52 w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
          {wine.organic && <Badge className="bg-ok/10 text-ok ring-1 ring-ok/40">Organic</Badge>}
          {wine.vegan && <Badge className="bg-black/40 text-ink-soft ring-1 ring-white/15">Vegan</Badge>}
        </div>
        {wine.vintage && (
          <span className="absolute right-3 top-3 font-display text-[18px] font-medium text-gold">{wine.vintage}</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-ink-faint">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: typeColour(wine.wine_type) }} />
          <span className="truncate">
            {typeLabel(wine.wine_type)} · {wine.region || wine.country}
          </span>
        </div>
        <Link href={href} className="mt-1.5">
          <h3 className="font-display text-[19px] leading-[1.15] font-medium text-ink group-hover:text-gold line-clamp-2">
            {wine.name}
          </h3>
        </Link>
        <p className="mt-1 text-[12px] text-ink-soft line-clamp-1">
          {[wine.grape_variety, wine.size, wine.abv ? `${Number(wine.abv)}%` : ""].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-auto pt-3">
          {wine.from_price && (
            <p className="mb-2 text-[12px] text-ink-faint">
              From <span className="text-ink font-semibold">{money(wine.from_price)}</span> a bottle inc VAT
            </p>
          )}
          <AddToBasket wine={wine} layout="card" />
        </div>
      </div>
    </article>
  );
}

export function WineCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface ring-1 ring-white/10 overflow-hidden animate-pulse">
      <div className="h-52 bg-[#202224]" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-24 bg-raised rounded" />
        <div className="h-5 w-full bg-raised rounded" />
        <div className="h-5 w-2/3 bg-raised rounded" />
        <div className="h-9 w-full bg-raised rounded-xl mt-6" />
      </div>
    </div>
  );
}
