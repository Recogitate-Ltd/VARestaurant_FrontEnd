"use client";

import clsx from "clsx";
import { ArrowLeft, Check, Truck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import BottleImage from "@/components/BottleImage";
import { deliveryText, vintageRange } from "@/components/FineWineCard";
import Gate from "@/components/Gate";
import RequestFineWine from "@/components/RequestFineWine";
import { Alert, Badge, PageSpinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { typeColour } from "@/lib/format";
import { useScrollToTop } from "@/lib/scroll";
import type { FineWine, FineWineCard } from "@/lib/types";

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="flex justify-between gap-6 py-3 border-b border-white/10 text-[14px]">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-right text-ink font-medium">{children}</dd>
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
  requested,
  muted,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  requested?: boolean;
  /** Not offered with the other choice; still clickable (it switches that choice). */
  muted?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      title={title}
      className={clsx(
        "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-[14px] transition-colors",
        active
          ? "border-gold bg-gold text-black"
          : muted
            ? "border-dashed border-white/15 bg-transparent text-ink-faint hover:border-gold/60 hover:text-ink"
            : "border-white/15 bg-surface text-ink hover:border-gold/60"
      )}
    >
      {children}
      {requested && <Check className={clsx("h-3.5 w-3.5", active ? "text-black/70" : "text-gold")} aria-label="requested" />}
    </button>
  );
}

const vintageOf = (o: FineWine) => o.vintage || "NV";

function Detail() {
  const { key } = useParams<{ key: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [card, setCard] = useState<FineWineCard | null>(null);
  const [error, setError] = useState("");
  const [vintage, setVintage] = useState<string | null>(null);
  const [offerId, setOfferId] = useState<number | null>(null);
  useScrollToTop(key);

  useEffect(() => {
    setCard(null);
    setError("");
    api<FineWineCard>(`/api/trade/fine-and-rare/${encodeURIComponent(decodeURIComponent(key))}/`)
      .then((data) => {
        setCard(data);
        // Open on the offer asked for (?offer=, e.g. from Requests), else the newest vintage.
        const wanted = Number(searchParams.get("offer"));
        const first = data.offers.find((o) => o.id === wanted) ?? data.offers[0];
        setVintage(vintageOf(first));
        setOfferId(first.id);
      })
      .catch((err) =>
        setError(err instanceof ApiError && err.status === 404 ? "This wine is no longer available." : err.message)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const sizes = useMemo(() => (card ? card.offers.filter((o) => vintageOf(o) === vintage) : []), [card, vintage]);
  const offer = sizes.find((o) => o.id === offerId) ?? sizes[0];

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Alert tone="error">{error}</Alert>
        <Link href="/fine-and-rare" className="mt-4 inline-block text-gold underline">
          Back to Fine &amp; Rare
        </Link>
      </main>
    );
  }
  if (!card || !offer) return <PageSpinner />;

  const colour = card.colour || "";
  const pickVintage = (v: string) => {
    setVintage(v);
    // Keep the same size where this vintage has it.
    const same = card.offers.find((o) => vintageOf(o) === v && o.format_label === offer.format_label);
    setOfferId((same ?? card.offers.find((o) => vintageOf(o) === v))!.id);
  };
  const requestedVintage = (v: string) => card.offers.some((o) => vintageOf(o) === v && o.requested);
  // Every size the wine comes in is shown. One the chosen vintage doesn't come
  // in is faded; choosing it moves to the newest vintage that has it.
  const pickSize = (format: string) => {
    const here = sizes.find((o) => o.format_label === format);
    const target = here ?? card.offers.find((o) => o.format_label === format)!;
    setVintage(vintageOf(target));
    setOfferId(target.id);
  };
  const vintagesWith = (format: string) =>
    card.offers.filter((o) => o.format_label === format).map(vintageOf);
  const hasSize = (v: string) => card.offers.some((o) => vintageOf(o) === v && o.format_label === offer.format_label);
  // Smallest first: single bottles, then cases by bottle count, then bottle size.
  const allSizes = Array.from(
    new Map(
      [...card.offers]
        .sort((x, y) => x.pack_size - y.pack_size || parseFloat(x.bottle_size || "0") - parseFloat(y.bottle_size || "0"))
        .map((o) => [o.format_label, o])
    ).keys()
  );
  const missingSizes = allSizes.filter((f) => !sizes.some((o) => o.format_label === f));

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
      <button
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/fine-and-rare"))}
        className="mt-6 inline-flex items-center gap-1.5 text-[14px] text-ink-soft hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Fine &amp; Rare
      </button>

      <div className="mt-4 grid gap-8 lg:gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative rounded-3xl bg-surface ring-1 ring-white/10 shadow-card overflow-hidden lg:sticky lg:top-[108px] lg:self-start">
          <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] max-h-[420px] sm:max-h-[480px] lg:max-h-[min(560px,70vh)] w-full bg-gradient-to-b from-[#202224] to-surface">
            <BottleImage
              src={offer.image_url || card.image_url}
              alt={card.name}
              type={colour}
              className="absolute inset-0 h-full w-full p-8"
              eager
            />
          </div>
          <Badge className="absolute left-4 top-4 bg-gold/15 text-gold ring-1 ring-gold/40">Fine &amp; Rare</Badge>
        </div>

        <div>
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-ink-faint">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: typeColour(colour) }} />
            {[colour, [card.region, card.country].filter((v, i, a) => v && a.indexOf(v) === i).join(", ")]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <h1 className="mt-3 font-display text-[34px] sm:text-[44px] leading-[1.05] font-medium text-white">{card.name}</h1>
          <p className="mt-2 text-[15px] text-ink-soft">
            {[card.producer && `by ${card.producer}`, card.vintages.length > 1 && vintageRange(card)]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <div className="mt-6 rounded-2xl bg-surface p-5 shadow-card ring-1 ring-white/10 space-y-5">
            <div>
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">
                Vintage{card.vintages.length > 1 ? ` · ${card.vintages.length} available` : ""}
              </p>
              <div role="radiogroup" aria-label="Vintage" className="flex flex-wrap gap-2">
                {card.vintages.map((v) => (
                  <Choice
                    key={v}
                    active={v === vintage}
                    onClick={() => pickVintage(v)}
                    requested={requestedVintage(v)}
                    muted={!hasSize(v)}
                    title={hasSize(v) ? undefined : `Not offered as ${offer.format_label}`}
                  >
                    {v}
                  </Choice>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">Size</p>
              <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
                {allSizes.map((f) => {
                  const here = sizes.find((o) => o.format_label === f);
                  return (
                    <Choice
                      key={f}
                      active={f === offer.format_label}
                      onClick={() => pickSize(f)}
                      requested={here?.requested}
                      muted={!here}
                      title={here ? undefined : `Available in ${vintagesWith(f).join(", ")}`}
                    >
                      {f}
                    </Choice>
                  );
                })}
              </div>
              {missingSizes.length > 0 && (
                <p className="mt-2 text-[12px] text-ink-faint">
                  Faded sizes aren&apos;t offered in {vintage}. Choose one to switch to a vintage that has it.
                </p>
              )}
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">
                Request a quote · {vintage} {offer.format_label}
              </p>
              <RequestFineWine
                key={offer.id}
                wine={offer}
                layout="full"
                onRequested={(sent) =>
                  setCard((c) =>
                    c && {
                      ...c,
                      requested: true,
                      offers: c.offers.map((o) => (o.id === sent.id ? { ...o, requested: true } : o)),
                    }
                  )
                }
              />
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-faint">
                <Truck className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
                {deliveryText(offer)} · subject to availability
              </p>
            </div>
          </div>

          {card.taste_profile && (
            <section className="mt-8">
              <h2 className="font-display text-[26px] font-medium text-white">Style</h2>
              <p className="mt-2 text-[16px] leading-relaxed text-ink">{card.taste_profile}</p>
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-display text-[26px] font-medium text-white">Details</h2>
            <dl className="mt-2">
              <Spec label="Producer">{card.producer}</Spec>
              <Spec label="Country">{card.country}</Spec>
              <Spec label="Region">{card.region}</Spec>
              <Spec label="Colour">{card.colour}</Spec>
              <Spec label="Grape variety">{card.grape_variety}</Spec>
              <Spec label="Vintages">{card.vintages.join(", ")}</Spec>
              <Spec label="ABV">{offer.abv ? `${offer.abv.replace(/\s*%$/, "")}%` : null}</Spec>
              <Spec label="Sizes (all vintages)">{allSizes.join(", ")}</Spec>
              <Spec label="Food pairing">{card.food_pairing}</Spec>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function FineWineDetailPage() {
  return (
    <Gate sections={["fine-and-rare"]}>
      <Suspense>
        <Detail />
      </Suspense>
    </Gate>
  );
}
