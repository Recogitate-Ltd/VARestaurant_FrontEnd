"use client";

import { ArrowLeft, Truck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import BottleImage from "@/components/BottleImage";
import { deliveryText } from "@/components/FineWineCard";
import Gate from "@/components/Gate";
import RequestFineWine from "@/components/RequestFineWine";
import { Alert, Badge, PageSpinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { typeColour } from "@/lib/format";
import { useScrollToTop } from "@/lib/scroll";
import type { FineWine } from "@/lib/types";

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="flex justify-between gap-6 py-3 border-b border-white/10 text-[14px]">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-right text-ink font-medium">{children}</dd>
    </div>
  );
}

function Detail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [wine, setWine] = useState<FineWine | null>(null);
  const [error, setError] = useState("");
  useScrollToTop(id);

  useEffect(() => {
    setWine(null);
    setError("");
    api<FineWine>(`/api/trade/fine-and-rare/${encodeURIComponent(id)}/`)
      .then(setWine)
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 404 ? "This wine is no longer available." : err.message
        )
      );
  }, [id]);

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
  if (!wine) return <PageSpinner />;

  const colour = wine.colour || "";

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
            <BottleImage src={wine.image_url} alt={wine.name} type={colour} className="absolute inset-0 h-full w-full p-8" eager />
          </div>
          <Badge className="absolute left-4 top-4 bg-gold/15 text-gold ring-1 ring-gold/40">Fine &amp; Rare</Badge>
        </div>

        <div>
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-ink-faint">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: typeColour(colour) }} />
            {[colour, [wine.region, wine.country].filter((v, i, a) => v && a.indexOf(v) === i).join(", ")]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <h1 className="mt-3 font-display text-[34px] sm:text-[44px] leading-[1.05] font-medium text-white">
            {[wine.vintage, wine.name].filter(Boolean).join(" ")}
          </h1>
          {wine.producer && <p className="mt-2 text-[15px] text-ink-soft">by {wine.producer}</p>}

          <div className="mt-6 rounded-2xl bg-surface p-5 shadow-card ring-1 ring-white/10">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">Request a quote</p>
              <p className="text-[12px] text-ink-faint">{wine.format_label}</p>
            </div>
            <RequestFineWine wine={wine} layout="full" />
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-faint">
              <Truck className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
              {deliveryText(wine)} · subject to availability
            </p>
          </div>

          {wine.taste_profile && (
            <section className="mt-8">
              <h2 className="font-display text-[26px] font-medium text-white">Style</h2>
              <p className="mt-2 text-[16px] leading-relaxed text-ink">{wine.taste_profile}</p>
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-display text-[26px] font-medium text-white">Details</h2>
            <dl className="mt-2">
              <Spec label="Producer">{wine.producer}</Spec>
              <Spec label="Country">{wine.country}</Spec>
              <Spec label="Region">{wine.region}</Spec>
              <Spec label="Colour">{wine.colour}</Spec>
              <Spec label="Grape variety">{wine.grape_variety}</Spec>
              <Spec label="Vintage">{wine.vintage}</Spec>
              <Spec label="ABV">{wine.abv ? `${wine.abv.replace(/\s*%$/, "")}%` : null}</Spec>
              <Spec label="Sold as">{wine.format_label}</Spec>
              <Spec label="Food pairing">{wine.food_pairing}</Spec>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function FineWineDetailPage() {
  return (
    <Gate wines restaurant>
      <Detail />
    </Gate>
  );
}
