"use client";

import { ArrowLeft, Leaf, Sprout } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import AddToBasket from "@/components/AddToBasket";
import BottleImage from "@/components/BottleImage";
import Gate from "@/components/Gate";
import WineCard from "@/components/WineCard";
import { Alert, Badge, PageSpinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isMember, typeColour, typeLabel } from "@/lib/format";
import type { WineDetail } from "@/lib/types";

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
  const { account } = useAuth();
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [wine, setWine] = useState<WineDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setWine(null);
    setError("");
    api<WineDetail>(`/api/trade/wines/${encodeURIComponent(decodeURIComponent(code))}/`)
      .then(setWine)
      .catch((err) =>
        setError(err instanceof ApiError && err.status === 404 ? "This wine is no longer on the list." : err.message)
      );
  }, [code]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Alert tone="error">{error}</Alert>
        <Link href="/wines" className="mt-4 inline-block text-gold underline">
          Back to the list
        </Link>
      </main>
    );
  }
  if (!wine) return <PageSpinner />;

  const producerParam = new URLSearchParams({ view: "all", producer: wine.producer }).toString();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
      <button
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/wines"))}
        className="mt-6 inline-flex items-center gap-1.5 text-[14px] text-ink-soft hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" /> Back to the list
      </button>

      <div className="mt-4 grid gap-8 lg:gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative rounded-3xl bg-surface ring-1 ring-white/10 shadow-card overflow-hidden lg:sticky lg:top-[108px] lg:self-start">
          {/* The photo is positioned inside a fixed frame so a tall image can't
              stretch it; the frame is capped to fit the screen. */}
          <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] max-h-[420px] sm:max-h-[480px] lg:max-h-[min(560px,70vh)] w-full bg-gradient-to-b from-[#202224] to-surface">
            <BottleImage
              src={wine.image_url}
              alt={wine.name}
              type={wine.wine_type}
              className="absolute inset-0 h-full w-full p-8"
              eager
            />
          </div>
          <div className="absolute left-4 top-4 flex flex-col gap-1.5">
            {wine.organic && (
              <Badge className="bg-ok/10 text-ok ring-1 ring-ok/40 gap-1">
                <Sprout className="h-3 w-3" /> Organic
              </Badge>
            )}
            {wine.vegan && (
              <Badge className="bg-surface text-ink-soft ring-1 ring-white/15 gap-1">
                <Leaf className="h-3 w-3" /> Vegan
              </Badge>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-ink-faint">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: typeColour(wine.wine_type) }} />
            {typeLabel(wine.wine_type)} · {[wine.region, wine.country].filter(Boolean).join(", ")}
          </div>
          <h1 className="mt-3 font-display text-[34px] sm:text-[44px] leading-[1.05] font-medium text-white">{wine.name}</h1>
          <p className="mt-2 text-[15px] text-ink-soft">
            by{" "}
            <Link href={`/wines?${producerParam}`} className="text-ink underline decoration-gold underline-offset-4 hover:text-gold">
              {wine.producer}
            </Link>
          </p>

          <div className="mt-6 rounded-2xl bg-surface p-5 shadow-card ring-1 ring-white/10">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">
                {wine.assigned ? "Order" : "Your price"}
              </p>
              {wine.assigned && <p className="text-[12px] text-ink-faint">Your prices, ex VAT</p>}
            </div>
            <AddToBasket wine={wine} />
            {wine.assigned && (
              <p className="mt-3 text-[12px] text-ink-faint">
                {isMember(account) ? "Billed separately by our team" : "Invoiced on ordering · 30 days to pay"}
              </p>
            )}
          </div>

          {wine.tasting_note && (
            <section className="mt-8">
              <h2 className="font-display text-[26px] font-medium text-white">Tasting note</h2>
              <p className="mt-2 text-[16px] leading-relaxed text-ink">{wine.tasting_note}</p>
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-display text-[26px] font-medium text-white">Details</h2>
            <dl className="mt-2">
              <Spec label="Producer">{wine.producer}</Spec>
              <Spec label="Country">{wine.country}</Spec>
              <Spec label="Region">{wine.region}</Spec>
              <Spec label="Type">{wine.wine_type}</Spec>
              <Spec label="Grape variety">{wine.grape_variety}</Spec>
              <Spec label="Vintage">{wine.vintage}</Spec>
              <Spec label="ABV">{wine.abv ? `${Number(wine.abv)}%` : null}</Spec>
              <Spec label="Bottle size">{wine.size}</Spec>
              <Spec label="Closure">{wine.closure}</Spec>
              <Spec label="Organic">{wine.organic ? "Yes" : "No"}</Spec>
              <Spec label="Vegan">{wine.vegan ? "Yes" : "No"}</Spec>
              <Spec label="Product code">{wine.product_code}</Spec>
            </dl>
          </section>

          {wine.producer_note && (
            <section className="mt-8 rounded-2xl bg-deep text-white p-6 sm:p-7">
              <p className="text-gold text-[11px] uppercase tracking-[0.25em]">About the producer</p>
              <h2 className="mt-1 font-display text-[26px] font-medium">{wine.producer}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">{wine.producer_note}</p>
            </section>
          )}
        </div>
      </div>

      {wine.more_from_producer.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[30px] font-medium text-white">More from {wine.producer}</h2>
            <Link href={`/wines?${producerParam}`} className="shrink-0 text-[14px] text-gold underline">
              See all
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:gap-5 grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {wine.more_from_producer.slice(0, 4).map((w) => (
              <WineCard key={w.id} wine={w} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default function WineDetailPage() {
  return (
    <Gate wines>
      <Detail />
    </Gate>
  );
}
