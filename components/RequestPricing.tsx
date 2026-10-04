"use client";

import clsx from "clsx";
import { Check, MessageSquareQuote } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import type { Wine } from "@/lib/types";

/**
 * Shown instead of prices on wines that aren't on the restaurant's list.
 * Asks the team for a price; once sent it shows "Pricing requested".
 */
export default function RequestPricing({
  wine,
  layout = "card",
  onRequested,
}: {
  wine: Wine;
  layout?: "card" | "full";
  onRequested?: (wine: Wine) => void;
}) {
  const [requested, setRequested] = useState(wine.pricing_requested);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (requested) {
    return (
      <div
        className={clsx(
          "flex items-start gap-2.5 rounded-xl border border-gold/40 bg-gold/10 px-3 text-gold-dark",
          layout === "full" ? "py-3.5 text-[14px]" : "py-2.5 text-[13px]"
        )}
      >
        <Check className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          <b className="font-medium">Pricing requested.</b>{" "}
          <span className="text-ink-soft">We&apos;ll email you when this wine is on your list.</span>{" "}
          <Link href="/requests" className="text-gold underline-offset-2 hover:underline">
            View your requests
          </Link>
        </span>
      </div>
    );
  }

  const send = async () => {
    setBusy(true);
    setError("");
    try {
      const updated = await api<Wine>(`/api/trade/wines/${encodeURIComponent(wine.product_code)}/request-pricing/`, {
        method: "POST",
        body: { note: note.trim() },
      });
      setRequested(true);
      onRequested?.(updated);
      // Lets the wine list keep its "requests waiting" reminder up to date.
      window.dispatchEvent(new Event("va-pricing-requested"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send your request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {layout === "full" && (
        <>
          <p className="text-[14px] text-ink-soft">
            This wine isn&apos;t on your list yet. Ask us for your price and we&apos;ll add it, usually within one
            working day.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Anything we should know? e.g. expected volume (optional)"
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3.5 py-2.5 text-[14px] text-white placeholder:text-ink-faint outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </>
      )}
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className={clsx(
          "w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gold text-gold hover:bg-gold/10 transition-colors disabled:opacity-60",
          layout === "full" ? "h-11 text-[15px]" : "h-9 text-[13px]"
        )}
      >
        {busy ? <Spinner className="h-4 w-4" /> : <MessageSquareQuote className="h-4 w-4" strokeWidth={1.5} />}
        Request pricing
      </button>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
