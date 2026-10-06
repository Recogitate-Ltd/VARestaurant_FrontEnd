"use client";

import { Trash2, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";
import { QuantityStepper } from "@/components/AddToBasket";
import BottleImage from "@/components/BottleImage";
import { BasketSummary, MinimumOrderNote } from "@/components/OrderTotals";
import { ButtonLink } from "@/components/ui";
import { BasketLine, lineHref, useBasket } from "@/lib/basket";
import { useAuth } from "@/lib/auth";
import { FORMAT_SHORT, contentsSummary, isMember, money, packLabel, seesAccessories, seesWines, visibleSections } from "@/lib/format";

/** "Case of 6 · 75cl" for wine, "Set of 2" for accessories. */
export function lineDetail(l: BasketLine): string {
  if (l.format === "accessory") return packLabel(l.pack ?? "");
  return [FORMAT_SHORT[l.format], l.size].filter(Boolean).join(" · ");
}

/** Small product thumbnail: accessories sit on a light panel so clear glass shows. */
export function LineThumb({ line, className }: { line: Pick<BasketLine, "format" | "image_url" | "name" | "wine_type">; className: string }) {
  const accessory = line.format === "accessory";
  return (
    <BottleImage
      src={line.image_url}
      alt={line.name}
      type={accessory ? "accessory" : line.wine_type}
      className={accessory ? `${className} rounded-md bg-[#F3EFE9] p-1` : className}
    />
  );
}

export function BasketLines({ compact = false }: { compact?: boolean }) {
  const { lines, setQuantity, remove } = useBasket();
  return (
    <ul className="divide-y divide-white/10">
      {lines.map((l) => (
        <li key={`${l.product_code}-${l.format}`} className="flex gap-3 py-4">
          <Link href={lineHref(l)} className="shrink-0 w-14 h-20 rounded-lg bg-[#202224] grid place-items-center">
            <LineThumb line={l} className="h-[72px] w-12" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <Link
                href={lineHref(l)}
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
              {lineDetail(l)} · {money(l.unit_price)} each
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
  const { lines, subtotal, total, bottles, accessories } = useBasket();
  const { account } = useAuth();
  const sections = visibleSections(account);
  const wines = seesWines(account);

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
              <p className="mt-2 text-[14px] text-ink-soft">
                {wines
                  ? "Browse the list and add bottles or cases."
                  : seesAccessories(account)
                    ? "Browse our glassware and decanters."
                    : "Anything you order will appear here."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {sections
                  .filter((s) => s.path !== "/fine-and-rare")
                  .map((s, i) => (
                    <ButtonLink key={s.path} href={s.path} variant={i === 0 ? "secondary" : "ghost"}>
                      {s.path === "/accessories" ? "Glassware & decanters" : s.browse}
                    </ButtonLink>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <BasketLines compact />
            </div>
            <footer className="border-t border-white/10 bg-surface px-5 py-4 space-y-3">
              <p className="text-[13px] text-ink-soft">{contentsSummary(bottles, accessories)}</p>
              <BasketSummary subtotal={subtotal} total={total} hasAccessories={accessories > 0} />
              <MinimumOrderNote total={total} />
              <ButtonLink href="/checkout" size="lg" className="w-full">
                Checkout
              </ButtonLink>
              <p className="text-center text-[12px] text-ink-faint">
                {isMember(account) ? "Nothing to pay now: we'll arrange billing with you" : "Pay by invoice within 30 days"}
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
