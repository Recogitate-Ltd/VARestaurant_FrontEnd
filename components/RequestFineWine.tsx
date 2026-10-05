"use client";

import clsx from "clsx";
import { Check, MessageSquareQuote } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { QuantityStepper } from "@/components/AddToBasket";
import { Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import type { FineWine } from "@/lib/types";

/**
 * Fine & Rare wines have no price on the site: the restaurant picks how many
 * cases it would like and asks us for a quote. Once sent it shows "Requested".
 */
export default function RequestFineWine({
  wine,
  layout = "card",
  onRequested,
}: {
  wine: FineWine;
  layout?: "card" | "full";
  onRequested?: (wine: FineWine) => void;
}) {
  const [requested, setRequested] = useState(wine.requested);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unit = wine.pack_size > 1 ? "case" : "bottle";

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
          <b className="font-medium">Requested.</b>{" "}
          <span className="text-ink-soft">We&apos;ll email you a quote.</span>{" "}
          <Link href="/requests?tab=fine" className="text-gold underline-offset-2 hover:underline">
            View your requests
          </Link>
        </span>
      </div>
    );
  }

  const send = async () => {
    if (qty < 1) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/trade/fine-and-rare/${wine.id}/request/`, {
        method: "POST",
        body: { quantity: qty, note: note.trim() },
      });
      setRequested(true);
      onRequested?.(wine);
      // Lets the Fine & Rare page keep its "requests waiting" reminder up to date.
      window.dispatchEvent(new Event("va-fine-wine-requested"));
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
            Sourced to order from our fine wine partners. Tell us how many {unit}s you&apos;d like and we&apos;ll
            email you a quote, usually within one working day.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Anything we should know? e.g. a date you need it by (optional)"
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3.5 py-2.5 text-[14px] text-white placeholder:text-ink-faint outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </>
      )}
      <div className="flex items-center gap-2">
        <QuantityStepper
          value={qty}
          onChange={setQty}
          size={layout === "card" ? "sm" : "md"}
          label={unit === "case" ? "Cases" : "Bottles"}
        />
        <button
          type="button"
          onClick={send}
          disabled={busy || qty < 1}
          className={clsx(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-gold text-gold hover:bg-gold/10 transition-colors disabled:opacity-60",
            layout === "full" ? "h-11 text-[15px]" : "h-9 text-[13px]"
          )}
        >
          {busy ? <Spinner className="h-4 w-4" /> : <MessageSquareQuote className="h-4 w-4" strokeWidth={1.5} />}
          Request
        </button>
      </div>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
