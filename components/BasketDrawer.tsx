"use client";

import { Trash2, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";
import { QuantityStepper } from "@/components/AddToBasket";
import BottleImage from "@/components/BottleImage";
import { ButtonLink } from "@/components/ui";
import { useBasket } from "@/lib/basket";
import { FORMAT_SHORT, money } from "@/lib/format";

export function BasketLines({ compact = false }: { compact?: boolean }) {
  const { lines, setQuantity, remove } = useBasket();
  return (
    <ul className="divide-y divide-white/10">
      {lines.map((l) => (
        <li key={`${l.product_code}-${l.format}`} className="flex gap-3 py-4">
          <Link
            href={`/wines/${encodeURIComponent(l.product_code)}`}
            className="shrink-0 w-14 h-20 rounded-lg bg-[#202224] grid place-items-center"
          >
            <BottleImage src={l.image_url} alt={l.name} type={l.wine_type} className="h-[72px] w-12" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <Link
                href={`/wines/${encodeURIComponent(l.product_code)}`}
                className="font-display text-[17px] leading-tight font-medium text-ink hover:text-gold line-clamp-2 flex-1"
              >
                {l.name}
              </Link>
              <button
                onClick={() => remove(l.product_code, l.format)}
                aria-label={`Remove ${l.name}`}
                className="p-1 -m-1 text-ink-faint hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[12px] text-ink-soft mt-0.5">
              {FORMAT_SHORT[l.format]} · {l.size} · {money(l.unit_price)} each
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <QuantityStepper
                size="sm"
                value={l.quantity}
                onChange={(q) => setQuantity(l.product_code, l.format, q)}
                label={`Quantity of ${l.name}`}
              />
              <span className={compact ? "text-[14px] font-semibold" : "text-[15px] font-semibold"}>
                {money(Number(l.unit_price) * l.quantity)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function BasketDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, total, vat, bottles } = useBasket();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <div className={open ? "fixed inset-0 z-50" : "pointer-events-none fixed inset-0 z-50"} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Basket"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-base border-l border-white/10 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-5 h-16 border-b border-white/10 bg-surface">
          <h2 className="font-display text-[24px] font-medium text-white">Your basket</h2>
          <button onClick={onClose} aria-label="Close basket" className="p-2 -mr-2 text-ink-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </header>
        {lines.length === 0 ? (
          <div className="flex-1 grid place-items-center px-8 text-center">
            <div>
              <p className="font-display text-[22px] text-white">Your basket is empty</p>
              <p className="mt-2 text-[14px] text-ink-soft">Browse the list and add bottles or cases.</p>
              <ButtonLink href="/wines" className="mt-6" variant="secondary">
                Browse wines
              </ButtonLink>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <BasketLines compact />
            </div>
            <footer className="border-t border-white/10 bg-surface px-5 py-4 space-y-3">
              <div className="flex justify-between text-[13px] text-ink-soft">
                <span>
                  {bottles} bottle{bottles === 1 ? "" : "s"} · VAT included
                </span>
                <span>{money(vat)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[15px] font-medium">Total inc VAT</span>
                <span className="font-display text-[26px] font-medium text-white">{money(total)}</span>
              </div>
              <ButtonLink href="/checkout" size="lg" className="w-full">
                Checkout
              </ButtonLink>
              <p className="text-center text-[12px] text-ink-faint">Pay by invoice within 30 days</p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
