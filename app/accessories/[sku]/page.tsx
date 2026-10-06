"use client";

import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import AccessoryCard, { AccessoryPrice, AddAccessory, packSummary } from "@/components/AccessoryCard";
import BottleImage from "@/components/BottleImage";
import Gate from "@/components/Gate";
import { Alert, Badge, PageSpinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { keepScrollOnNextPage, useScrollToTop } from "@/lib/scroll";
import { categoryLabel, isMember, money, packLabel, withoutBrand } from "@/lib/format";
import type { AccessoryDetail } from "@/lib/types";

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="flex justify-between gap-6 py-3 border-b border-white/10 text-[14px]">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-right text-ink font-medium">{children}</dd>
    </div>
  );
}

const WINES_SHOWN = 12;

function Detail() {
  const { account } = useAuth();
  const { sku } = useParams<{ sku: string }>();
  const router = useRouter();
  const [item, setItem] = useState<AccessoryDetail | null>(null);
  const [error, setError] = useState("");
  const [allWines, setAllWines] = useState(false);
  useScrollToTop(sku);

  useEffect(() => {
    setItem(null);
    setError("");
    setAllWines(false);
    api<AccessoryDetail>(`/api/trade/accessories/${encodeURIComponent(decodeURIComponent(sku))}/`)
      .then(setItem)
      .catch((err) =>
        setError(err instanceof ApiError && err.status === 404 ? "This item is no longer available." : err.message)
      );
  }, [sku]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Alert tone="error">{error}</Alert>
        <Link href="/accessories" className="mt-4 inline-block text-gold underline">
          Back to accessories
        </Link>
      </main>
    );
  }
  if (!item) return <PageSpinner />;

  const name = withoutBrand(item.name, item.brand);
  const collection = item.collection.replace(/^(RIEDEL|SPIEGELAU|NACHTMANN) /i, "");
  const wines = allWines ? item.recommended_for : item.recommended_for.slice(0, WINES_SHOWN);
  const packs = [item, ...item.other_packs].sort((a, b) => a.pieces - b.pieces || Number(a.price) - Number(b.price));

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
      <button
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/accessories"))}
        className="mt-6 inline-flex items-center gap-1.5 text-[14px] text-ink-soft hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" /> Back to accessories
      </button>

      <div className="mt-4 grid gap-8 lg:gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative rounded-3xl bg-[#F3EFE9] shadow-card overflow-hidden lg:sticky lg:top-[108px] lg:self-start">
          <div className="relative aspect-square max-h-[480px] lg:max-h-[min(560px,70vh)] w-full">
            <BottleImage
              src={item.image_url}
              alt={item.name}
              type="accessory"
              className="absolute inset-0 h-full w-full p-8 sm:p-10"
              eager
            />
          </div>
          {item.label && (
            <Badge className="absolute left-4 top-4 bg-[#121416] text-gold ring-1 ring-gold/40">{item.label}</Badge>
          )}
        </div>

        <div>
          <p className="text-[12px] uppercase tracking-[0.16em] text-ink-faint">
            <span className="text-gold">{item.brand}</span>
            {collection && <> · {collection}</>} · {categoryLabel(item.category)}
          </p>
          <h1 className="mt-3 font-display text-[34px] sm:text-[44px] leading-[1.05] font-medium text-white">{name}</h1>
          <p className="mt-2 text-[15px] text-ink-soft">{packSummary(item)}</p>

          <div className="mt-6 rounded-2xl bg-surface p-5 shadow-card ring-1 ring-white/10 space-y-4">
            {packs.length > 1 && (
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink mb-2">Pack size</p>
                <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-3" role="radiogroup" aria-label="Pack size">
                  {packs.map((p) => {
                    const active = p.sku === item.sku;
                    return (
                      <Link
                        key={p.sku}
                        href={`/accessories/${encodeURIComponent(p.sku)}`}
                        role="radio"
                        aria-checked={active}
                        replace
                        scroll={false}
                        onClick={active ? undefined : keepScrollOnNextPage}
                        className={clsx(
                          "rounded-xl border px-2.5 py-2 transition-colors",
                          active ? "border-gold bg-gold text-black" : "border-white/15 bg-surface hover:border-gold/60"
                        )}
                      >
                        <span className={clsx("block text-[11px] leading-tight", active ? "text-black/60" : "text-ink-soft")}>
                          {packLabel(p.pack)}
                        </span>
                        <span className="block text-[14px] font-semibold leading-tight mt-0.5">{money(p.price)}</span>
                        {p.pieces > 1 && (
                          <span className={clsx("block text-[11px]", active ? "text-black/60" : "text-ink-faint")}>
                            {money(p.price_per_piece)} each
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            <AccessoryPrice item={item} size="lg" />
            <AddAccessory item={item} layout="full" />
            <p className="text-[12px] text-ink-faint">
              {isMember(account)
                ? "Price inc VAT · billed separately by our team"
                : "Trade price inc VAT · invoiced with your order · 30 days to pay"}
            </p>
          </div>

          {item.description && (
            <section className="mt-8">
              <h2 className="font-display text-[26px] font-medium text-white">About</h2>
              {item.description.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="mt-2 text-[16px] leading-relaxed text-ink">
                  {para}
                </p>
              ))}
            </section>
          )}

          {item.recommended_for.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-[26px] font-medium text-white">Ideal for</h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {wines.map((w) => (
                  <li key={w} className="rounded-full border border-white/15 bg-surface px-3 py-1 text-[13px] text-ink-soft">
                    {w}
                  </li>
                ))}
              </ul>
              {item.recommended_for.length > WINES_SHOWN && (
                <button onClick={() => setAllWines((v) => !v)} className="mt-3 text-[13px] text-gold underline">
                  {allWines ? "Show fewer" : `Show all ${item.recommended_for.length}`}
                </button>
              )}
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-display text-[26px] font-medium text-white">Details</h2>
            <dl className="mt-2">
              <Spec label="Brand">{item.brand}</Spec>
              <Spec label="Collection">{collection}</Spec>
              <Spec label="Type">{item.glassware_type || item.sub_category}</Spec>
              <Spec label="Made">{item.fabrication && item.fabrication !== "various" ? item.fabrication : null}</Spec>
              <Spec label="Material">{item.material}</Spec>
              <Spec label="Colour">{item.colour}</Spec>
              <Spec label="Height">{item.height_mm ? `${item.height_mm} mm` : null}</Spec>
              <Spec label="Max diameter">{item.diameter_mm ? `${item.diameter_mm} mm` : null}</Spec>
              <Spec label="Recommended pour">{item.pour_ml ? `${item.pour_ml} ml` : null}</Spec>
              <Spec label="Pack">{packLabel(item.pack)}</Spec>
              <Spec label="Pieces">{item.pieces > 1 ? item.pieces : null}</Spec>
              <Spec label="Product code">{item.sku}</Spec>
            </dl>
          </section>
        </div>
      </div>

      {item.more_from_collection.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[30px] font-medium text-white">More from {collection}</h2>
            <Link
              href={`/accessories?${new URLSearchParams({ q: collection }).toString()}`}
              className="shrink-0 text-[14px] text-gold underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:gap-5 grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {item.more_from_collection.slice(0, 4).map((a) => (
              <AccessoryCard key={a.id} item={a} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default function AccessoryDetailPage() {
  return (
    <Gate sections={["accessories"]}>
      <Detail />
    </Gate>
  );
}
