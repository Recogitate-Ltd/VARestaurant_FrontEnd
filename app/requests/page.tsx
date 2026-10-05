"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import BottleImage from "@/components/BottleImage";
import Gate from "@/components/Gate";
import { Alert, Badge, Button, ButtonLink, PageSpinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, seesFineAndRare } from "@/lib/format";
import type { FineWineRequest, Paginated, PriceRequest, PriceRequestStatus } from "@/lib/types";

const TABS = [
  { value: "open", label: "Waiting" },
  { value: "all", label: "All requests" },
  { value: "fine", label: "Fine & Rare" },
] as const;
type Tab = (typeof TABS)[number]["value"];
type Row = PriceRequest | FineWineRequest;

function StatusBadge({ status, label }: { status: PriceRequestStatus; label: string }) {
  const tone =
    status === "priced"
      ? "bg-ok/10 text-ok ring-1 ring-ok/40"
      : status === "declined"
        ? "bg-white/5 text-ink-faint ring-1 ring-white/15"
        : "bg-gold/10 text-gold ring-1 ring-gold/40";
  const text = status === "open" ? "Waiting" : status === "priced" ? "On your list" : label;
  return <Badge className={tone}>{text}</Badge>;
}

function RequestRow({ r }: { r: PriceRequest }) {
  const details = [r.producer, r.vintage, r.size].filter(Boolean).join(" · ");
  const body = (
    <>
      <BottleImage src={r.image_url} alt={r.wine_name} type={r.wine_type} className="h-20 w-12 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ink">{r.wine_name}</span>
          <StatusBadge status={r.status} label={r.status_label} />
        </div>
        {details && <p className="mt-0.5 text-[13px] text-ink-soft">{details}</p>}
        <p className="mt-0.5 text-[13px] text-ink-faint">
          Requested {formatDate(r.created_at)}
          {r.resolved_at && (
            <>
              {" "}
              · {r.status === "priced" ? "Added" : "Answered"} {formatDate(r.resolved_at)}
            </>
          )}
        </p>
        {r.note && (
          <p className="mt-2 text-[13px] text-ink-soft">
            <span className="text-ink-faint">Your note:</span> {r.note}
          </p>
        )}
        {r.response_note && (
          <p className="mt-1 text-[13px] text-ink-soft">
            <span className="text-ink-faint">Our reply:</span> {r.response_note}
          </p>
        )}
        {!r.wine_available && <p className="mt-1 text-[13px] text-ink-faint">No longer in our catalogue.</p>}
      </div>
      {r.wine_available && <ChevronRight className="h-5 w-5 text-ink-faint shrink-0" />}
    </>
  );
  const cls = "flex items-center gap-4 rounded-2xl bg-surface p-4 sm:p-5 shadow-card ring-1 ring-white/10";
  return r.wine_available ? (
    <Link href={`/wines/${encodeURIComponent(r.product_code)}`} className={`${cls} hover:ring-gold/40`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function FineRequestRow({ r }: { r: FineWineRequest }) {
  const unit = r.format_label.startsWith("Single") ? "bottle" : "case";
  const details = [r.producer, r.format_label, `${r.quantity} ${unit}${r.quantity === 1 ? "" : "s"}`]
    .filter(Boolean)
    .join(" · ");
  const tone =
    r.status === "quoted"
      ? "bg-ok/10 text-ok ring-1 ring-ok/40"
      : r.status === "declined"
        ? "bg-white/5 text-ink-faint ring-1 ring-white/15"
        : "bg-gold/10 text-gold ring-1 ring-gold/40";
  const body = (
    <>
      <BottleImage src={r.image_url} alt={r.wine_name} type="red" className="h-20 w-12 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ink">{[r.vintage, r.wine_name].filter(Boolean).join(" ")}</span>
          <Badge className={tone}>{r.status === "open" ? "Waiting" : r.status_label}</Badge>
        </div>
        {details && <p className="mt-0.5 text-[13px] text-ink-soft">{details}</p>}
        <p className="mt-0.5 text-[13px] text-ink-faint">
          Requested {formatDate(r.created_at)}
          {r.resolved_at && <> · Answered {formatDate(r.resolved_at)}</>}
        </p>
        {r.note && (
          <p className="mt-2 text-[13px] text-ink-soft">
            <span className="text-ink-faint">Your note:</span> {r.note}
          </p>
        )}
        {r.response_note && (
          <p className="mt-1 text-[13px] text-ink-soft whitespace-pre-line">
            <span className="text-ink-faint">{r.status === "quoted" ? "Our quote:" : "Our reply:"}</span>{" "}
            {r.response_note}
          </p>
        )}
      </div>
      {r.wine_id && <ChevronRight className="h-5 w-5 text-ink-faint shrink-0" />}
    </>
  );
  const cls = "flex items-center gap-4 rounded-2xl bg-surface p-4 sm:p-5 shadow-card ring-1 ring-white/10";
  return r.wine_id ? (
    <Link
      href={`/fine-and-rare/${encodeURIComponent(r.wine_key || String(r.wine_id))}?offer=${r.wine_id}`}
      className={`${cls} hover:ring-gold/40`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function Requests() {
  const { account } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showFine = seesFineAndRare(account);
  const tabs = TABS.filter((t) => t.value !== "fine" || showFine);
  const wanted = searchParams.get("tab");
  const tab: Tab = wanted === "all" || (wanted === "fine" && showFine) ? wanted : "open";
  const setTab = (t: Tab) => router.replace(t === "open" ? "/requests" : `/requests?tab=${t}`, { scroll: false });
  const [requests, setRequests] = useState<Row[] | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = (t: Tab, p: number): Promise<Paginated<Row>> =>
    t === "fine"
      ? api<Paginated<FineWineRequest>>("/api/trade/fine-and-rare/requests/", { query: { page: p } })
      : api<Paginated<PriceRequest>>("/api/trade/price-requests/", {
          query: { page: p, status: t === "open" ? "open" : undefined },
        });

  useEffect(() => {
    let current = true;
    setRequests(null);
    setError("");
    fetchPage(tab, 1)
      .then((d) => {
        if (!current) return;
        setRequests(d.results);
        setCount(d.count);
        setPage(1);
        setTotalPages(d.total_pages);
      })
      .catch((err) => current && setError(err.message));
    return () => {
      current = false;
    };
  }, [tab]);

  const more = async () => {
    setLoadingMore(true);
    try {
      const d = await fetchPage(tab, page + 1);
      setRequests((r) => [...(r ?? []), ...d.results]);
      setPage(page + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load more requests.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[38px] sm:text-[44px] font-medium text-white">
            {tab === "fine" ? "Fine & Rare requests" : "Pricing requests"}
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            {tab === "fine"
              ? "Fine & Rare wines you've asked us to quote for. We'll email you each quote."
              : "Wines you've asked us to price. We'll email you when each one is on your list."}
          </p>
        </div>
        <ButtonLink href={tab === "fine" ? "/fine-and-rare" : "/wines?view=all"} variant="secondary" size="sm">
          {tab === "fine" ? "Browse Fine & Rare" : "Browse all wines"}
        </ButtonLink>
      </div>

      <div role="tablist" aria-label="Which requests" className="mt-6 inline-flex rounded-xl border border-white/15 bg-black/20 p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={
              tab === t.value
                ? "h-9 rounded-lg bg-gold px-4 text-[14px] text-black"
                : "h-9 rounded-lg px-4 text-[14px] text-ink-soft hover:text-white"
            }
          >
            {t.label}
            {tab === t.value && requests ? ` (${count})` : ""}
          </button>
        ))}
      </div>

      {error ? (
        <Alert tone="error" className="mt-6">{error}</Alert>
      ) : !requests ? (
        <PageSpinner />
      ) : requests.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-surface p-10 text-center ring-1 ring-white/10">
          <p className="font-display text-[24px] text-white">
            {tab === "open" ? "Nothing waiting" : "No requests yet"}
          </p>
          <p className="mt-2 text-[14px] text-ink-soft max-w-md mx-auto">
            {tab === "open"
              ? "You have no pricing requests waiting on us."
              : tab === "fine"
                ? "Find a wine in Fine & Rare and tap “Request” — it will appear here."
                : "Find a wine that isn't on your list and tap “Request pricing” — it will appear here."}
          </p>
          {tab === "open" && (
            <Button variant="secondary" className="mt-5" onClick={() => setTab("all")}>
              See all requests
            </Button>
          )}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {requests.map((r) => (
            <li key={r.id}>
              {tab === "fine" ? <FineRequestRow r={r as FineWineRequest} /> : <RequestRow r={r as PriceRequest} />}
            </li>
          ))}
        </ul>
      )}
      {requests && page < totalPages && (
        <div className="mt-6 text-center">
          <Button variant="secondary" onClick={more} loading={loadingMore}>
            Show older requests
          </Button>
        </div>
      )}
    </main>
  );
}

export default function RequestsPage() {
  return (
    <Gate wines>
      <Suspense>
        <Requests />
      </Suspense>
    </Gate>
  );
}
