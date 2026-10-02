"use client";

import clsx from "clsx";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import React, { useEffect, useState } from "react";
import RequestPricing from "@/components/RequestPricing";
import { useBasket } from "@/lib/basket";
import { money } from "@/lib/format";
import type { FormatCode, Wine } from "@/lib/types";

export function QuantityStepper({
  value,
  onChange,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
  label?: string;
}) {
  const h = size === "sm" ? "h-9" : "h-11";
  return (
    <div className={clsx("inline-flex items-center rounded-full border border-white/15 bg-surface", h)}>
      <button
        type="button"
        aria-label={`Decrease ${label.toLowerCase()}`}
        onClick={() => onChange(Math.max(0, value - 1))}
        className={clsx("grid place-items-center rounded-full text-gold hover:bg-white/5", size === "sm" ? "w-9 h-9" : "w-11 h-11")}
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, "") || "0", 10);
          onChange(Math.min(n, 500));
        }}
        className="w-9 text-center text-[15px] font-medium bg-transparent outline-none"
      />
      <button
        type="button"
        aria-label={`Increase ${label.toLowerCase()}`}
        onClick={() => onChange(Math.min(500, value + 1))}
        className={clsx("grid place-items-center rounded-full text-gold hover:bg-white/5", size === "sm" ? "w-9 h-9" : "w-11 h-11")}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Pick a format (bottle / case of 3, 6, 12), a quantity, and add to basket.
 * `layout="card"` is the compact version for catalogue cards.
 */
export default function AddToBasket({ wine, layout = "full" }: { wine: Wine; layout?: "card" | "full" }) {
  const { add } = useBasket();
  const formats = wine.formats;
  const [format, setFormat] = useState<FormatCode | null>(formats[0]?.code ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  // Not on this restaurant's list (or not sold in any format): ask for a price.
  if (!wine.assigned || formats.length === 0) {
    return <RequestPricing wine={wine} layout={layout} />;
  }

  const selected = formats.find((f) => f.code === format) ?? formats[0];

  const onAdd = () => {
    if (qty < 1) return;
    add(wine, selected.code, qty);
    setAdded(true);
    setQty(1);
  };

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Format" className={clsx("grid gap-1.5", layout === "card" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
        {formats.map((f) => {
          const active = f.code === selected.code;
          return (
            <button
              key={f.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setFormat(f.code)}
              className={clsx(
                "rounded-xl border px-2.5 py-2 text-left transition-colors",
                active ? "border-gold bg-gold text-black" : "border-white/15 bg-surface hover:border-gold/60"
              )}
            >
              <span className={clsx("block text-[11px] leading-tight", active ? "text-black/60" : "text-ink-soft")}>
                {f.label}
              </span>
              <span className="block text-[14px] font-semibold leading-tight mt-0.5">{money(f.price)}</span>
              {f.bottles > 1 && layout === "full" && (
                <span className={clsx("block text-[11px]", active ? "text-black/60" : "text-ink-faint")}>
                  {money(f.price_per_bottle)} / bottle
                </span>
              )}
            </button>
          );
        })}
      </div>
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
          {added ? "Added" : layout === "card" ? "Add" : `Add · ${money(Number(selected.price) * Math.max(qty, 1))}`}
        </button>
      </div>
    </div>
  );
}
