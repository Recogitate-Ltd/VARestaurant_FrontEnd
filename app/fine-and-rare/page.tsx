"use client";

import clsx from "clsx";
import { MessageSquareQuote, Search, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import FineWineCard from "@/components/FineWineCard";
import Gate from "@/components/Gate";
import { WineCardSkeleton } from "@/components/WineCard";
import WineTabs from "@/components/WineTabs";
import { Alert, Button } from "@/components/ui";
import { api } from "@/lib/api";
import { typeColour } from "@/lib/format";
import type { FineWineCard as Card, FineWineFacets, Paginated } from "@/lib/types";

const SORTS = [
  { value: "producer", label: "Producer" },
  { value: "name", label: "Name A–Z" },
];

interface Filters {
  q: string;
  colour: string;
  sort: string;
}

function fromParams(params: URLSearchParams): Filters {
  return { q: params.get("q") || "", colour: params.get("colour") || "", sort: params.get("sort") || "producer" };
}

function toParams(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.colour) p.set("colour", f.colour);
  if (f.sort && f.sort !== "producer") p.set("sort", f.sort);
  return p.toString();
}

function apiPath(f: Filters, page: number): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.colour) p.set("colour", f.colour);
  p.set("sort", f.sort || "producer");
  p.set("page", String(page));
  return `/api/trade/fine-and-rare/?${p.toString()}`;
}

function FineAndRare() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => fromParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [query, setQuery] = useState(filters.q);
  const [facets, setFacets] = useState<FineWineFacets | null>(null);
  const [wines, setWines] = useState<Card[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const setFilters = useCallback(
    (next: Filters) => {
      const qs = toParams(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  useEffect(() => {
    api<FineWineFacets>("/api/trade/fine-and-rare/filters/")
      .then(setFacets)
      .catch(() => undefined);
  }, []);

  // A new request from a card bumps the reminder without refetching.
  useEffect(() => {
    const bump = () => setFacets((f) => (f ? { ...f, open_requests: f.open_requests + 1 } : f));
    window.addEventListener("va-fine-wine-requested", bump);
    return () => window.removeEventListener("va-fine-wine-requested", bump);
  }, []);

  useEffect(() => setQuery(filters.q), [filters.q]);

  useEffect(() => {
    if (query === filters.q) return;
    const t = setTimeout(() => setFilters({ ...filters, q: query.trim() }), 350);
    return () => clearTimeout(t);
  }, [query, filters, setFilters]);

  const key = toParams(filters);
  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    api<Paginated<Card>>(apiPath(filters, 1))
      .then((data) => {
        if (id !== requestId.current) return;
        setWines(data.results);
        setCount(data.count);
        setPage(1);
        setTotalPages(data.total_pages);
      })
      .catch((err) => id === requestId.current && setError(err.message))
      .finally(() => id === requestId.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await api<Paginated<Card>>(apiPath(filters, page + 1));
      setWines((w) => [...w, ...data.results]);
      setPage(page + 1);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load more wines.");
    } finally {
      setLoadingMore(false);
    }
  };

  const pill = (active: boolean) =>
    clsx(
      "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] transition-colors",
      active ? "border-gold bg-gold text-black" : "border-white/15 bg-surface text-ink-soft hover:border-gold/60 hover:text-white"
    );

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
      <div className="pt-8 sm:pt-10 pb-5">
        <h1 className="font-display text-[38px] sm:text-[46px] leading-none font-medium text-white">Fine &amp; Rare</h1>
        <p className="mt-2 max-w-2xl text-[14px] text-ink-soft">
          Icons and hard-to-find wines from the world&apos;s great estates, sourced to order from our fine wine
          partners. Request a quote on any wine and we&apos;ll come back to you, usually within one working day.
        </p>
        <p className="mt-2 flex items-center gap-2 text-[13px] text-ink-faint">
          <Truck className="h-4 w-4 text-gold" strokeWidth={1.5} />
          Delivery in 3–4 weeks · priced on request
        </p>
        <WineTabs active="fine" />
        {!!facets?.open_requests && (
          <Link
            href="/requests?tab=fine"
            className="mt-4 flex w-fit items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-2 text-[13px] text-gold hover:bg-gold/15"
          >
            <MessageSquareQuote className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>
              {facets.open_requests} request{facets.open_requests === 1 ? "" : "s"} waiting on us
              <span className="text-ink-soft"> · View your requests</span>
            </span>
          </Link>
        )}
      </div>

      <div className="sticky top-16 lg:top-[88px] z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-base/80 backdrop-blur border-b border-white/5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search wine, producer, region or vintage"
              aria-label="Search Fine & Rare wines"
              className="w-full h-11 rounded-full border border-white/15 bg-surface pl-10 pr-4 text-[15px] outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            aria-label="Sort by"
            className="h-11 w-[8.5rem] sm:w-auto rounded-full border border-white/15 bg-surface px-4 text-[14px] text-ink outline-none focus:border-gold"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {facets && facets.colours.length > 1 && (
          <div className="mt-3 -mx-4 sm:mx-0 px-4 sm:px-0 flex gap-2 overflow-x-auto">
            <button className={pill(!filters.colour)} onClick={() => setFilters({ ...filters, colour: "" })}>
              All
            </button>
            {facets.colours.map((c) => (
              <button
                key={c.value}
                className={pill(filters.colour === c.value)}
                onClick={() => setFilters({ ...filters, colour: filters.colour === c.value ? "" : c.value })}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: typeColour(c.value) }} />
                {c.value}
              </button>
            ))}
          </div>
        )}
      </div>

      <section aria-live="polite" className="mt-6">
        <p className="mb-4 text-[14px] text-ink-soft">
          {loading ? "Finding wines…" : `${(count ?? 0).toLocaleString()} wine${count === 1 ? "" : "s"}`}
        </p>

        {error && <Alert tone="error" className="mb-4">{error}</Alert>}

        {loading ? (
          <div className="grid gap-4 sm:gap-5 grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <WineCardSkeleton key={i} />
            ))}
          </div>
        ) : wines.length === 0 && facets?.total === 0 ? (
          <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-white/10">
            <p className="font-display text-[26px] text-white">New wines are on their way</p>
            <p className="mt-2 text-[14px] text-ink-soft max-w-md mx-auto">
              We&apos;re choosing this season&apos;s Fine &amp; Rare wines. Looking for something in particular? Just
              ask us and we&apos;ll find it for you.
            </p>
          </div>
        ) : wines.length === 0 ? (
          <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-white/10">
            <p className="font-display text-[24px] text-white">No wines match</p>
            <p className="mt-2 text-[14px] text-ink-soft">Try a different search or colour.</p>
            <Button variant="secondary" className="mt-5" onClick={() => setFilters({ q: "", colour: "", sort: filters.sort })}>
              Clear search
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:gap-5 grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wines.map((w) => (
                <FineWineCard key={w.key} card={w} />
              ))}
            </div>
            {page < totalPages && (
              <div className="mt-8 text-center">
                <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                  Show more wines
                </Button>
                <p className="mt-2 text-[12px] text-ink-faint">
                  Showing {wines.length.toLocaleString()} of {(count ?? 0).toLocaleString()}
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default function FineAndRarePage() {
  return (
    <Gate wines restaurant>
      <Suspense>
        <FineAndRare />
      </Suspense>
    </Gate>
  );
}
