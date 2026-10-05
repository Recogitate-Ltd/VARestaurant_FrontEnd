import clsx from "clsx";
import React from "react";
import { MIN_ORDER_TOTAL, money } from "@/lib/format";

/** Below the minimum order (inc VAT)? Pennies are compared, not floats. */
export function underMinimum(total: number, minimum: number = MIN_ORDER_TOTAL): boolean {
  return Math.round(total * 100) < Math.round(minimum * 100);
}

/**
 * The minimum-order note: how much more to add, or nothing once it's met.
 * The minimum is inc VAT, so it's judged on the total inc VAT.
 */
export function MinimumOrderNote({
  total,
  minimum = MIN_ORDER_TOTAL,
  className,
}: {
  total: number;
  minimum?: number;
  className?: string;
}) {
  if (!underMinimum(total, minimum)) return null;
  return (
    <p className={clsx("rounded-xl border border-gold/50 bg-gold-light/40 px-4 py-3 text-[13px]", className)}>
      Our minimum order is <b>{money(minimum)} inc VAT</b>. Add <b>{money(minimum - total)}</b> more (inc VAT) to
      check out.
    </p>
  );
}

/**
 * Basket summary for the basket and drawer: wine is priced ex VAT, so the
 * subtotal leads and VAT is added at checkout. The inc-VAT total is shown
 * small because the minimum order is judged on it.
 */
export function BasketSummary({
  subtotal,
  total,
  hasAccessories,
  large = false,
}: {
  subtotal: number;
  total: number;
  hasAccessories: boolean;
  large?: boolean;
}) {
  return (
    <>
      <div className="flex justify-between items-baseline">
        <span className={clsx("font-medium", !large && "text-[15px]")}>Subtotal ex VAT</span>
        <span className={clsx("font-display font-medium text-white", large ? "text-[28px]" : "text-[26px]")}>
          {money(subtotal)}
        </span>
      </div>
      <p className="text-[12px] text-ink-faint">
        VAT is added at checkout ({money(total)} inc VAT)
        {hasAccessories ? ". Glassware prices already include VAT." : "."}
      </p>
    </>
  );
}

/** Subtotal, VAT and total rows for checkout and placed orders. */
export function VatBreakdown({
  subtotal,
  vat,
  total,
  totalClassName = "text-[30px]",
}: {
  subtotal: number | string;
  vat: number | string;
  total: number | string;
  totalClassName?: string;
}) {
  return (
    <>
      <div className="flex justify-between text-[14px] text-ink-soft">
        <span>Subtotal ex VAT</span>
        <span>{money(subtotal)}</span>
      </div>
      <div className="flex justify-between text-[14px] text-ink-soft">
        <span>VAT (20%)</span>
        <span>{money(vat)}</span>
      </div>
      <div className="flex justify-between items-baseline pt-1">
        <span className="font-medium">Total inc VAT</span>
        <span className={clsx("font-display font-medium text-white", totalClassName)}>{money(total)}</span>
      </div>
    </>
  );
}
