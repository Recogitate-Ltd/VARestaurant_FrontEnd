"use client";

import React from "react";
import { BasketLines } from "@/components/BasketDrawer";
import Gate from "@/components/Gate";
import { ButtonLink, PageSpinner } from "@/components/ui";
import { useBasket } from "@/lib/basket";
import { BasketSummary, MinimumOrderNote } from "@/components/OrderTotals";
import { contentsSummary } from "@/lib/format";

function Basket() {
  const { lines, subtotal, total, bottles, accessories, ready } = useBasket();
  if (!ready) return <PageSpinner />;
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-[38px] font-medium text-white">Basket</h1>
      {lines.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-surface p-10 text-center ring-1 ring-white/10">
          <p className="font-display text-[22px] text-white">Your basket is empty</p>
          <ButtonLink href="/wines" variant="secondary" className="mt-5">
            Browse wines
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-surface px-5 shadow-card ring-1 ring-white/10">
          <BasketLines />
          <div className="border-t border-white/10 py-5 space-y-2">
            <p className="text-[14px] text-ink-soft">{contentsSummary(bottles, accessories)}</p>
            <BasketSummary subtotal={subtotal} total={total} hasAccessories={accessories > 0} large />
            <MinimumOrderNote total={total} />
            <ButtonLink href="/checkout" size="lg" className="w-full mt-2">
              Checkout
            </ButtonLink>
          </div>
        </div>
      )}
    </main>
  );
}

export default function BasketPage() {
  return (
    <Gate>
      <Basket />
    </Gate>
  );
}
