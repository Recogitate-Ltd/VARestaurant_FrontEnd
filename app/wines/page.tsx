"use client";

import { MessageSquareQuote, Search, SlidersHorizontal, Wine as WineGlass, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Filters, { ActiveChips, EMPTY_FILTERS, FilterState, LIST_KEYS, activeFilterCount } from "@/components/Filters";
import Gate from "@/components/Gate";
import WineCard, { WineCardSkeleton } from "@/components/WineCard";
import WineTabs from "@/components/WineTabs";
import { Alert, Button } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isMember, seesAccessories } from "@/lib/format";
import type { Facets, Paginated, Wine } from "@/lib/types";

const SORTS = [
  { value: "name", label: "Name A–Z" },
  { value: "producer", label: "Producer" },
  { value: "price", label: "Price: low to high" },
  { value: "-price", label: "Price: high to low" },
  { value: "-vintage", label: "Vintage: newest" },
  { value: "vintage", label: "Vintage: oldest" },
];

function fromParams(params: URLSearchParams): FilterState {
  const f: FilterState = { ...EMPTY_FILTERS };
  f.view = params.get("view") === "all" ? "all" : "mine";
  f.q = params.get("q") || "";
  f.sort = params.get("sort") || "name";
  for (const key of LIST_KEYS) {
    const raw = params.get(key);
    f[key] = raw ? raw.split("|").filter(Boolean) : [];
  }
  f.organic = params.get("organic") === "1";
  f.vegan = params.get("vegan") === "1";
  f.priced = params.get("priced") === "1";
  f.min_price = params.get("min_price") || "";
  f.max_price = params.get("max_price") || "";
  return f;
}

function toParams(f: FilterState): string {
  const p = new URLSearchParams();
  if (f.view === "all") p.set("view", "all");
  if (f.q) p.set("q", f.q);
  if (f.sort && f.sort !== "name") p.set("sort", f.sort);
  // "|" in the page URL because some values contain commas.
  for (const key of LIST_KEYS) if (f[key].length) p.set(key, f[key].join("|"));
  if (f.organic) p.set("organic", "1");
  if (f.vegan) p.set("vegan", "1");
  if (f.priced) p.set("priced", "1");
  if (f.min_price) p.set("min_price", f.min_price);
  if (f.max_price) p.set("max_price", f.max_price);
  return p.toString();
}

/** The API takes repeated params, so values containing commas survive. */
function apiPath(f: FilterState, page: number): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  p.set("sort", f.sort || "name");
  for (const key of LIST_KEYS) for (const v of f[key]) p.append(key, v);
  if (f.organic) p.set("organic", "1");
  if (f.vegan) p.set("vegan", "1");
  if (f.priced) p.set("priced", "1");
  if (f.min_price) p.set("min_price", f.min_price);
  if (f.max_price) p.set("max_price", f.max_price);
  if (f.view !== "all") p.set("mine", "1");
  p.set("page", String(page));
  return `/api/trade/wines/?${p.toString()}`;
}

function Catalogue() {
  const { account } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => fromParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [query, setQuery] = useState(filters.q);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [wines, setWines] = useState<Wine[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const requestId = useRef(0);

  const setFilters = useCallback(
    (next: FilterState) => {
      const qs = toParams(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  useEffect(() => {
    setFacets(null);
    api<Facets>("/api/trade/filters/", { query: { mine: filters.view === "mine" ? 1 : undefined } })
      .then(setFacets)
      .catch(() => undefined);
  }, [filters.view]);

  // A new "Request pricing" from a card bumps the reminder without refetching.
  useEffect(() => {
    const bump = () => setFacets((f) => (f ? { ...f, open_price_requests: f.open_price_requests + 1 } : f));
    window.addEventListener("va-pricing-requested", bump);
    return () => window.removeEventListener("va-pricing-requested", bump);
  }, []);

  // Keep the box in step with back/forward navigation.
  useEffect(() => setQuery(filters.q), [filters.q]);

  // Search as you type, lightly debounced.
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
    api<Paginated<Wine>>(apiPath(filters, 1))
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
      const data = await api<Paginated<Wine>>(apiPath(filters, page + 1));
      setWines((w) => [...w, ...data.results]);
      setPage(page + 1);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load more wines.");
    } finally {
      setLoadingMore(false);
    }
  };

  const nActive = activeFilterCount(filters);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
      <div className="pt-8 sm:pt-10 pb-5">
        <h1 className="font-display text-[38px] sm:text-[46px] leading-none font-medium text-white">
          {filters.view === "mine" ? "Your wine list" : "The full list"}
        </h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          {filters.view === "mine"
            ? "Wines on your list, at your prices (ex VAT) · single bottles and cases of 6"
            : "Browse everything we carry · request pricing on any wine that isn't on your list yet"}
        </p>
        <WineTabs
          active={filters.view}
          myWinesCount={facets ? facets.my_wines : null}
          onSelect={(view) => setFilters({ ...filters, view })}
        />
        {seesAccessories(account) && (
          <Link
            href="/accessories"
            className="mt-4 ml-0 sm:ml-3 inline-flex w-fit items-center gap-2 align-middle text-[13px] text-ink-soft hover:text-gold"
          >
            <WineGlass className="h-4 w-4 text-gold" strokeWidth={1.5} />
            Riedel glassware &amp; decanters{isMember(account) ? "" : " at trade prices"} →
          </Link>
        )}
        {!!facets?.open_price_requests && (
          <Link
            href="/requests"
            className="mt-4 flex w-fit items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-2 text-[13px] text-gold hover:bg-gold/15"
          >
            <MessageSquareQuote className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>
              {facets.open_price_requests} pricing request{facets.open_price_requests === 1 ? "" : "s"} waiting on us
              <span className="text-ink-soft"> · View your requests</span>
            </span>
          </Link>
        )}
      </div>

      {/* Search + sort, sticky under the header */}
      <div className="sticky top-16 lg:top-[88px] z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-base/80 backdrop-blur border-b border-white/5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search wine, producer, grape, region or code"
              aria-label="Search wines"
              className="w-full h-11 rounded-full border border-white/15 bg-surface pl-10 pr-4 text-[15px] outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="lg:hidden inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-surface px-4 text-[14px] text-gold"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {nActive > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-black">
                {nActive}
              </span>
            )}
          </button>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            aria-label="Sort by"
            className="hidden sm:block h-11 rounded-full border border-white/15 bg-surface px-4 text-[14px] text-ink outline-none focus:border-gold"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-[164px] max-h-[calc(100vh-10rem)] overflow-y-auto pr-2 -mt-4">
            <Filters facets={facets} value={filters} onChange={setFilters} />
          </div>
        </aside>

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center gap-3 min-h-8">
            <p className="text-[14px] text-ink-soft">
              {loading ? "Finding wines…" : `${(count ?? 0).toLocaleString()} wine${count === 1 ? "" : "s"}`}
            </p>
            <ActiveChips value={filters} onChange={setFilters} />
          </div>

          {error && <Alert tone="error" className="mb-4">{error}</Alert>}

          {loading ? (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <WineCardSkeleton key={i} />
              ))}
            </div>
          ) : wines.length === 0 && filters.view === "mine" && facets?.my_wines === 0 ? (
            <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-white/10">
              <p className="font-display text-[26px] text-white">Your wine list is being set up</p>
              <p className="mt-2 text-[14px] text-ink-soft max-w-md mx-auto">
                We&apos;ll add the wines and prices agreed for your restaurant. In the meantime, browse the full list and
                request pricing on anything you&apos;d like to order.
              </p>
              <Button className="mt-5" onClick={() => setFilters({ ...EMPTY_FILTERS, view: "all" })}>
                Browse all wines
              </Button>
            </div>
          ) : wines.length === 0 ? (
            <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-white/10">
              <p className="font-display text-[24px] text-white">No wines match</p>
              <p className="mt-2 text-[14px] text-ink-soft">Try a different search or remove a filter.</p>
              <Button variant="secondary" className="mt-5" onClick={() => setFilters({ ...EMPTY_FILTERS, view: filters.view })}>
                Clear search &amp; filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:gap-5 grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3">
                {wines.map((w) => (
                  <WineCard key={w.id} wine={w} />
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
      </div>

      {/* Mobile filter sheet */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSheetOpen(false)} />
          <div
            role="dialog"
            aria-label="Filters"
            className="absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col rounded-t-3xl bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 h-14 border-b border-white/10">
              <h2 className="font-display text-[22px] font-medium text-white">Filter &amp; sort</h2>
              <button onClick={() => setSheetOpen(false)} aria-label="Close filters" className="p-2 -mr-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <div className="py-4 border-b border-white/10 sm:hidden">
                <label className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">Sort by</label>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  className="mt-2 w-full h-11 rounded-xl border border-white/15 bg-surface px-3 text-[15px]"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <Filters facets={facets} value={filters} onChange={setFilters} />
            </div>
            <div className="flex gap-3 border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setFilters({ ...EMPTY_FILTERS, view: filters.view, q: filters.q, sort: filters.sort })}
              >
                Clear
              </Button>
              <Button className="flex-[2]" onClick={() => setSheetOpen(false)}>
                {loading ? "Updating…" : `Show ${(count ?? 0).toLocaleString()} wines`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function WinesPage() {
  return (
    <Gate sections={["wines"]}>
      <Suspense>
        <Catalogue />
      </Suspense>
    </Gate>
  );
}
