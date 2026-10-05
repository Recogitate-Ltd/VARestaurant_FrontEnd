"use client";

import clsx from "clsx";
import { Check, ShoppingBag } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { QuantityStepper } from "@/components/AddToBasket";
import BottleImage from "@/components/BottleImage";
import { Badge } from "@/components/ui";
import { useBasket } from "@/lib/basket";
import { money, packLabel, withoutBrand } from "@/lib/format";
import type { Accessory } from "@/lib/types";

/** Our price (inc VAT). No RRP or saving is shown. */
export function AccessoryPrice({ item, size = "md" }: { item: Accessory; size?: "md" | "lg" }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={clsx("font-semibold text-ink", size === "lg" ? "text-[28px] font-display font-medium text-white" : "text-[17px]")}>
        {money(item.price)}
      </span>
      <span className={clsx("text-ink-faint", size === "lg" ? "text-[13px]" : "text-[11px]")}>inc VAT</span>
    </div>
  );
}

/** Quantity and "Add" for one accessory pack. */
export function AddAccessory({ item, layout = "card" }: { item: Accessory; layout?: "card" | "full" }) {
  const { addAccessory } = useBasket();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  const onAdd = () => {
    if (qty < 1) return;
    addAccessory(item, qty);
    setAdded(true);
    setQty(1);
  };

  return (
    <div className="flex items-center gap-2">
      <QuantityStepper value={qty} onChange={setQty} size={layout === "card" ? "sm" : "md"} />
      <button
        type="button"
        onClick={onAdd}
        disabled={qty < 1}
        className={clsx(
          "flex-1 inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50",
          layout === "card" ? "h-9 text-[13px]" : "h-11 text-[15px]",
          added ? "bg-ok text-white" : "bg-gold text-black hover:bg-gold-dim"
        )}
      >
        {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
        {added ? "Added" : layout === "card" ? "Add" : `Add · ${money(Number(item.price) * Math.max(qty, 1))}`}
      </button>
    </div>
  );
}

/** Pieces in a pack, e.g. "Set of 2 · £22.50 per glass". */
export function packSummary(item: Accessory): string {
  const pack = packLabel(item.pack);
  if (item.pieces <= 1) return pack;
  const noun = /decanter|carafe/i.test(item.category) ? "piece" : "glass";
  return `${pack} · ${money(item.price_per_piece)} per ${noun}`;
}

export default function AccessoryCard({ item }: { item: Accessory }) {
  const href = `/accessories/${encodeURIComponent(item.sku)}`;
  const name = withoutBrand(item.name, item.brand);
  // The collection, unless the product name already says it ("Veritas Cabernet").
  const collection = item.collection.replace(/^(RIEDEL|SPIEGELAU|NACHTMANN) /i, "");
  const showCollection = !!collection && !name.toLowerCase().includes(collection.toLowerCase());
  return (
    <article className="group flex flex-col rounded-2xl bg-surface shadow-card ring-1 ring-white/10 overflow-hidden transition-shadow hover:shadow-lift">
      {/* Clear crystal disappears on a dark background, so photos sit on a light panel. */}
      <Link href={href} className="relative block bg-[#F3EFE9]" aria-label={item.name}>
        <BottleImage
          src={item.image_url}
          alt={item.name}
          type="accessory"
          className="h-52 sm:h-56 w-full p-5 transition-transform duration-300 group-hover:scale-[1.04]"
        />
        {item.label && (
          <Badge className="absolute left-3 top-3 bg-[#121416] text-gold ring-1 ring-gold/40">{item.label}</Badge>
        )}
        {item.pieces > 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-[#121416]/85 px-2.5 py-1 text-[11px] text-white">
            × {item.pieces}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4 pt-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint truncate">
          <span className="text-gold">{item.brand}</span>
          {showCollection && <> · {collection}</>}
        </p>
        <Link href={href} className="mt-1.5">
          <h3 className="font-display text-[19px] leading-[1.15] font-medium text-ink group-hover:text-gold line-clamp-2">
            {name}
          </h3>
        </Link>
        <p className="mt-1 text-[12px] text-ink-soft line-clamp-1">{packSummary(item)}</p>
        <div className="mt-auto pt-3 space-y-2.5">
          <AccessoryPrice item={item} />
          <AddAccessory item={item} />
        </div>
      </div>
    </article>
  );
}
