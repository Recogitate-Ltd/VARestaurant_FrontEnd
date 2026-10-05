"use client";

import clsx from "clsx";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AccessoryCard from "@/components/AccessoryCard";
import Gate from "@/components/Gate";
import { WineCardSkeleton } from "@/components/WineCard";
import { Alert, Button } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { categoryLabel, isMember } from "@/lib/format";
import type { Accessory, AccessoryFacets, Paginated } from "@/lib/types";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "name", label: "Name A–Z" },
  { value: "price", label: "Price: low to high" },
  { value: "-price", label: "Price: high to low" },
];

interface State {
  q: string;
  category: string;
  brand: string;
  sort: string;
}

function fromParams(params: URLSearchParams): State {
  return {
    q: params.get("q") || "",
    category: params.get("category") || "",
    brand: params.get("brand") || "",
    sort: params.get("sort") || "featured",
  };
}

function toParams(s: State): string {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.category) p.set("category", s.category);
  if (s.brand) p.set("brand", s.brand);
  if (s.sort !== "featured") p.set("sort", s.sort);
  return p.toString();
}

function apiPath(s: State, page: number): string {
  const p = new URLSearchParams(toParams(s));
  p.set("sort", s.sort);
  p.set("page", String(page));
  return `/api/trade/accessories/?${p.toString()}`;
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "h-9 shrink-0 rounded-full border px-4 text-[13px] whitespace-nowrap transition-colors",
        active ? "border-gold bg-gold text-black" : "border-white/15 bg-surface text-ink-soft hover:border-gold/60 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function Accessories() {
  const { account } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const state = useMemo(() => fromParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [query, setQuery] = useState(state.q);
  const [facets, setFacets] = useState<AccessoryFacets | null>(null);
  const [items, setItems] = useState<Accessory[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const setState = useCallback(
    (next: State) => {
      const qs = toParams(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  useEffect(() => {
    api<AccessoryFacets>("/api/trade/accessories/filters/")
      .then(setFacets)
      .catch(() => undefined);
  }, []);

  useEffect(() => setQuery(state.q), [state.q]);

  useEffect(() => {
    if (query === state.q) return;
    const t = setTimeout(() => setState({ ...state, q: query.trim() }), 350);
    return () => clearTimeout(t);
  }, [query, state, setState]);

  const key = toParams(state);
  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    api<Paginated<Accessory>>(apiPath(state, 1))
      .then((data) => {
        if (id !== requestId.current) return;
        setItems(data.results);
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
      const data = await api<Paginated<Accessory>>(apiPath(state, page + 1));
      setItems((list) => [...list, ...data.results]);
      setPage(page + 1);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load more.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
      <div className="pt-8 sm:pt-10 pb-5">
        <p className="text-gold text-[11px] uppercase tracking-[0.25em]">Riedel · Spiegelau · Nachtmann</p>
        <h1 className="mt-2 font-display text-[38px] sm:text-[46px] leading-none font-medium text-white">
          Wine accessories
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] text-ink-soft">
          Professional glassware, decanters and glass care from the Riedel family, at trade prices. Prices
          include VAT{isMember(account) ? "." : " and are invoiced with your wine order."}
        </p>
      </div>

      {/* Categories, then search / brand / sort, sticky under the header */}
      <div className="sticky top-16 lg:top-[88px] z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-base/85 backdrop-blur border-b border-white/5 space-y-3">
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Category">
          <Pill active={!state.category} onClick={() => setState({ ...state, category: "" })}>
            All{facets ? ` (${facets.total})` : ""}
          </Pill>
          {facets?.categories.map((c) => (
            <Pill
              key={c.value}
              active={state.category === c.value}
              onClick={() => setState({ ...state, category: state.category === c.value ? "" : c.value })}
            >
              {categoryLabel(c.value)} ({c.count})
            </Pill>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search glass, collection or grape (e.g. Pinot Noir)"
              aria-label="Search accessories"
              className="w-full h-11 rounded-full border border-white/15 bg-surface pl-10 pr-4 text-[15px] outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <select
            value={state.brand}
            onChange={(e) => setState({ ...state, brand: e.target.value })}
            aria-label="Brand"
            className="h-11 max-w-[38%] rounded-full border border-white/15 bg-surface px-4 text-[14px] text-ink outline-none focus:border-gold"
          >
            <option value="">All brands</option>
            {facets?.brands.map((b) => (
              <option key={b.value} value={b.value}>
                {b.value} ({b.count})
              </option>
            ))}
          </select>
          <select
            value={state.sort}
            onChange={(e) => setState({ ...state, sort: e.target.value })}
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

      <section aria-live="polite" className="mt-6">
        <p className="mb-4 text-[14px] text-ink-soft">
          {loading ? "Finding accessories…" : `${(count ?? 0).toLocaleString()} item${count === 1 ? "" : "s"}`}
          {state.category && !loading && <> in {categoryLabel(state.category).toLowerCase()}</>}
        </p>

        {error && <Alert tone="error" className="mb-4">{error}</Alert>}

        {loading ? (
          <div className="grid gap-4 sm:gap-5 grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <WineCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-white/10">
            <p className="font-display text-[24px] text-white">Nothing matches</p>
            <p className="mt-2 text-[14px] text-ink-soft">Try a different search, brand or category.</p>
            <Button variant="secondary" className="mt-5" onClick={() => setState({ q: "", category: "", brand: "", sort: state.sort })}>
              Show everything
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:gap-5 grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <AccessoryCard key={item.id} item={item} />
              ))}
            </div>
            {page < totalPages && (
              <div className="mt-8 text-center">
                <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                  Show more
                </Button>
                <p className="mt-2 text-[12px] text-ink-faint">
                  Showing {items.length.toLocaleString()} of {(count ?? 0).toLocaleString()}
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default function AccessoriesPage() {
  return (
    <Gate>
      <Suspense>
        <Accessories />
      </Suspense>
    </Gate>
  );
}
