"use client";

import clsx from "clsx";
import { Check, FileDown, Plus, Search, Send, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Field, PageSpinner, Spinner, TextArea } from "@/components/ui";
import { ApiError, api, downloadFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";
import type { Paginated, ProposalAccess, ProposalFilters, ProposalWine, SentProposal } from "@/lib/types";

/*
 * Wine list proposals, for the team's proposals login only (the server checks
 * too: the price list carries our cost prices). Pick wines from the supplier
 * price list, set the restaurant's margin per wine, then download or email a
 * branded PDF. Per bottle, ex VAT:
 *   our price  = cost (column Q) + our mark-up (25%)
 *   list price = our price + the restaurant's margin
 * The server reprices everything when it draws the PDF; the sums here mirror it.
 */

const DRAFT_KEY = "va_proposal_draft";

interface Line {
  wine: ProposalWine;
  /** As typed, so the box can be cleared while editing. */
  margin: string;
}

interface Customer {
  restaurant_name: string;
  contact_name: string;
  email: string;
  message: string;
}

const EMPTY_CUSTOMER: Customer = { restaurant_name: "", contact_name: "", email: "", message: "" };

/** ``amount`` plus ``percent``, to the penny (half up), as the server works it out. */
function addPercent(amount: number, percent: number): number {
  const pence = Math.round(amount * 100);
  return Math.round((pence * (100 + percent)) / 100) / 100;
}

function parseMargin(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1000 ? n : null;
}

function priced(line: Line) {
  const ours = Number(line.wine.va_price);
  const margin = parseMargin(line.margin);
  const listEx = margin === null ? null : addPercent(ours, margin);
  return {
    cost: Number(line.wine.cost_price),
    ours,
    margin,
    listEx,
    listInc: listEx === null ? null : addPercent(listEx, 20),
    profit: listEx === null ? null : Math.round((listEx - ours) * 100) / 100,
  };
}

function wineDetails(w: ProposalWine) {
  return [w.producer, w.region || w.country, w.size, w.vintage].filter(Boolean).join(" · ");
}

function NotForYou() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-gold-light text-gold">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="font-display text-[32px] leading-tight font-medium text-white">For the Vintage Associates team</h1>
      <p className="mt-3 text-[15px] text-ink-soft">
        Wine list proposals are made by our team. Log in with the team&apos;s proposals account to use this page.
      </p>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  all,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; count: number }[];
  all: string;
}) {
  return (
    <label className="block flex-1 min-w-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-xl border border-white/15 bg-black/20 px-3 text-[14px] text-white outline-none focus:border-gold"
      >
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.value} ({o.count})
          </option>
        ))}
      </select>
    </label>
  );
}

function PriceList({
  access,
  chosen,
  onAdd,
}: {
  access: ProposalAccess;
  chosen: Set<string>;
  onAdd: (wine: ProposalWine) => void;
}) {
  const [filters, setFilters] = useState<ProposalFilters | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<ProposalWine> | null>(null);
  const [wines, setWines] = useState<ProposalWine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<ProposalFilters>("/api/trade/proposals/wines/filters/").then(setFilters).catch(() => undefined);
  }, []);

  // Search as you type, once typing pauses.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [query, style, country]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api<Paginated<ProposalWine>>("/api/trade/proposals/wines/", {
      query: { search: query, style, country, page, page_size: 30 },
    })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setWines((prev) => (page === 1 ? res.results : [...prev, ...res.results]));
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Couldn't load the price list."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, style, country, page]);

  return (
    <section className="rounded-3xl bg-surface p-5 sm:p-6 shadow-card ring-1 ring-white/10">
      <h2 className="font-display text-[26px] font-medium text-white">Price list</h2>
      <p className="mt-1 text-[13px] text-ink-soft">
        {filters ? `${filters.total.toLocaleString("en-GB")} wines. ` : ""}Cost is the supplier price (ex VAT); our
        price adds {Number(access.va_markup_percent)}%.
      </p>

      <div className="mt-4 relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search wine, producer, region, vintage or code"
          aria-label="Search the price list"
          className="w-full h-11 rounded-xl border border-white/15 bg-black/20 pl-10 pr-3.5 text-[15px] text-white placeholder:text-ink-faint outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
      </div>
      <div className="mt-2 flex gap-2">
        <Select label="Style" value={style} onChange={setStyle} options={filters?.styles || []} all="All styles" />
        <Select
          label="Country"
          value={country}
          onChange={setCountry}
          options={filters?.countries || []}
          all="All countries"
        />
      </div>

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      <ul className="mt-4 divide-y divide-white/10 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
        {wines.map((w) => {
          const added = chosen.has(w.code);
          return (
            <li key={w.code} className="flex items-start gap-3 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-ink">{w.description}</p>
                <p className="mt-0.5 text-[12px] text-ink-faint">{wineDetails(w)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {w.style && <Badge className="bg-white/5 text-ink-soft ring-1 ring-white/10">{w.style}</Badge>}
                  {w.in_catalogue && (
                    <Badge className="bg-ok/10 text-ok ring-1 ring-ok/30">On our trade list</Badge>
                  )}
                  {w.group && w.group !== "Core" && (
                    <Badge
                      className={clsx(
                        "ring-1",
                        w.group === "Delisted"
                          ? "bg-danger/10 text-danger ring-danger/30"
                          : "bg-gold/10 text-gold ring-gold/30"
                      )}
                    >
                      {w.group}
                    </Badge>
                  )}
                  <span className="text-[12px] text-ink-faint">{w.code}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px] text-ink-faint">Cost {money(w.cost_price)}</p>
                <p className="text-[14px] text-gold">{money(w.va_price)}</p>
              </div>
              <Button
                size="sm"
                variant={added ? "ghost" : "secondary"}
                onClick={() => onAdd(w)}
                disabled={added}
                aria-label={added ? `${w.description} added` : `Add ${w.description}`}
                className="shrink-0 !px-3"
              >
                {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </li>
          );
        })}
      </ul>

      {loading && (
        <div className="flex justify-center py-6 text-gold">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {!loading && data && wines.length === 0 && (
        <p className="py-6 text-center text-[14px] text-ink-faint">No wines match.</p>
      )}
      {!loading && data && page < data.total_pages && (
        <div className="mt-3 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)}>
            Show more ({(data.count - wines.length).toLocaleString("en-GB")} left)
          </Button>
        </div>
      )}
    </section>
  );
}

function MarginInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const invalid = parseMargin(value) === null;
  return (
    <div className="relative w-[84px]">
      <input
        type="number"
        inputMode="decimal"
        min={0}
        max={1000}
        step={0.5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        aria-invalid={invalid}
        className={clsx(
          "w-full h-9 rounded-lg border bg-black/20 pl-2.5 pr-6 text-right text-[14px] text-white outline-none focus:border-gold",
          invalid ? "border-danger" : "border-white/15"
        )}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-ink-faint">%</span>
    </div>
  );
}

function Recent({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<SentProposal[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<SentProposal[]>("/api/trade/proposals/")
      .then(setRows)
      .catch(() => setRows([]));
  }, [refreshKey]);

  if (!rows || rows.length === 0) return null;
  return (
    <section className="rounded-3xl bg-surface p-5 sm:p-6 shadow-card ring-1 ring-white/10">
      <h2 className="font-display text-[22px] font-medium text-white">Recently sent</h2>
      {error && (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      )}
      <ul className="mt-3 divide-y divide-white/10">
        {rows.slice(0, 10).map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5 text-[13px]">
            <div className="flex-1 min-w-0">
              <p className="text-ink truncate">{p.restaurant_name || p.contact_name || p.email}</p>
              <p className="text-ink-faint truncate">
                {p.reference} · {p.wine_count} wine{p.wine_count === 1 ? "" : "s"} · {p.email} ·{" "}
                {p.sent_at ? `sent ${formatDate(p.sent_at)}` : "not sent"}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Download ${p.reference}`}
              onClick={() =>
                downloadFile(`/api/trade/proposals/${p.id}/pdf/`, `Proposal ${p.reference}.pdf`).catch((err) =>
                  setError(err instanceof Error ? err.message : "Download failed.")
                )
              }
            >
              <FileDown className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProposalBuilder({ access }: { access: ProposalAccess }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [defaultMargin, setDefaultMargin] = useState(String(Number(access.default_margin_percent)));
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "send" | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sentCount, setSentCount] = useState(0);

  // Keep the draft across reloads, in this browser only.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (Array.isArray(draft.lines)) setLines(draft.lines);
        if (draft.customer) setCustomer({ ...EMPTY_CUSTOMER, ...draft.customer });
        if (typeof draft.defaultMargin === "string") setDefaultMargin(draft.defaultMargin);
      }
    } catch {
      // No storage, or an old draft: start afresh.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ lines, customer, defaultMargin }));
    } catch {
      // Private mode etc.
    }
  }, [lines, customer, defaultMargin, loaded]);

  const chosen = useMemo(() => new Set(lines.map((l) => l.wine.code)), [lines]);

  const add = useCallback(
    (wine: ProposalWine) =>
      setLines((prev) =>
        prev.some((l) => l.wine.code === wine.code)
          ? prev
          : [...prev, { wine, margin: parseMargin(defaultMargin) === null ? "40" : defaultMargin }]
      ),
    [defaultMargin]
  );
  const setMargin = (code: string, margin: string) =>
    setLines((prev) => prev.map((l) => (l.wine.code === code ? { ...l, margin } : l)));
  const remove = (code: string) => setLines((prev) => prev.filter((l) => l.wine.code !== code));
  const applyToAll = () => {
    if (parseMargin(defaultMargin) === null) return;
    setLines((prev) => prev.map((l) => ({ ...l, margin: defaultMargin })));
  };

  const rows = lines.map((line) => ({ line, p: priced(line) }));
  const invalid = rows.some((r) => r.p.margin === null);
  const totalProfit = rows.reduce((sum, { p }) => sum + (p.profit ?? 0), 0);
  const averageMargin = rows.length
    ? Math.round((rows.reduce((sum, r) => sum + (r.p.margin ?? 0), 0) / rows.length) * 10) / 10
    : 0;

  const body = () => ({
    ...customer,
    lines: lines.map((l) => ({ code: l.wine.code, margin_percent: parseMargin(l.margin) })),
  });

  const fail = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) {
      setErrors(err.fieldErrors);
      setMessage({ tone: "error", text: err.message });
    } else {
      setMessage({ tone: "error", text: fallback });
    }
  };

  const preview = async () => {
    setBusy("pdf");
    setMessage(null);
    setErrors({});
    try {
      const name = customer.restaurant_name.trim();
      await downloadFile(
        "/api/trade/proposals/preview/",
        `Vintage Associates wine proposal${name ? ` – ${name}` : ""}.pdf`,
        body()
      );
    } catch (err) {
      fail(err, "We couldn't draw the PDF.");
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    if (!customer.email.trim()) {
      setErrors({ email: "Enter the customer's email address." });
      return;
    }
    setBusy("send");
    setMessage(null);
    setErrors({});
    try {
      const res = await api<{ reference: string; email: string }>("/api/trade/proposals/", {
        method: "POST",
        body: body(),
      });
      setMessage({ tone: "success", text: `Proposal ${res.reference} emailed to ${res.email}. The team was copied in.` });
      setSentCount((n) => n + 1);
    } catch (err) {
      fail(err, "We couldn't send the proposal.");
    } finally {
      setBusy(null);
    }
  };

  const startNew = () => {
    setLines([]);
    setCustomer(EMPTY_CUSTOMER);
    setMessage(null);
    setErrors({});
  };

  const field = (key: keyof Customer) => ({
    name: key,
    value: customer[key],
    error: errors[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setCustomer((c) => ({ ...c, [key]: e.target.value })),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start">
      <PriceList access={access} chosen={chosen} onAdd={add} />

      <div className="space-y-6">
        <section className="rounded-3xl bg-surface p-5 sm:p-6 shadow-card ring-1 ring-white/10">
          <h2 className="font-display text-[26px] font-medium text-white">Customer</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Restaurant" placeholder="The Ivy Arms" {...field("restaurant_name")} />
            <Field label="Contact name" placeholder="Sam Lee" {...field("contact_name")} />
            <Field
              label="Email"
              type="text"
              inputMode="email"
              autoComplete="off"
              placeholder="sam@restaurant.co.uk"
              hint="Separate several addresses with commas."
              className="sm:col-span-2"
              {...field("email")}
            />
            <TextArea
              label="Message"
              optional
              rows={3}
              placeholder="Shown at the top of the PDF and in the email."
              className="sm:col-span-2"
              {...field("message")}
            />
          </div>
        </section>

        <section className="rounded-3xl bg-surface p-5 sm:p-6 shadow-card ring-1 ring-white/10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[26px] font-medium text-white">Proposal</h2>
              <p className="mt-1 text-[13px] text-ink-soft">
                Our price = cost + {Number(access.va_markup_percent)}%. List price = our price + the restaurant&apos;s
                margin. All per bottle.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] uppercase tracking-[0.12em] text-ink-soft">Restaurant margin</span>
              <MarginInput value={defaultMargin} onChange={setDefaultMargin} label="Restaurant margin for new wines" />
              <Button size="sm" variant="secondary" onClick={applyToAll} disabled={!lines.length}>
                Apply to all
              </Button>
            </div>
          </div>

          {errors.lines && (
            <Alert tone="error" className="mt-4">
              {errors.lines}
            </Alert>
          )}

          {lines.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center text-[14px] text-ink-faint">
              Add wines from the price list with <Plus className="inline h-4 w-4 align-[-3px]" />.
            </p>
          ) : (
            <div className="mt-5 -mx-5 sm:mx-0 overflow-x-auto">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead>
                  <tr className="border-b border-white/15 text-left text-[11px] uppercase tracking-[0.1em] text-ink-faint">
                    <th className="py-2 pl-5 sm:pl-0 pr-2 font-normal">Wine</th>
                    <th className="py-2 px-2 font-normal text-right">Cost</th>
                    <th className="py-2 px-2 font-normal text-right">Our price</th>
                    <th className="py-2 px-2 font-normal text-right">Margin</th>
                    <th className="py-2 px-2 font-normal text-right">List ex VAT</th>
                    <th className="py-2 px-2 font-normal text-right">Inc VAT</th>
                    <th className="py-2 px-2 font-normal text-right">Profit</th>
                    <th className="py-2 pr-5 sm:pr-0" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ line, p }) => (
                    <tr key={line.wine.code} className="border-b border-white/10 align-middle">
                      <td className="py-2.5 pl-5 sm:pl-0 pr-2">
                        <p className="text-ink">{line.wine.description}</p>
                        <p className="text-[12px] text-ink-faint">{wineDetails(line.wine)}</p>
                      </td>
                      <td className="py-2.5 px-2 text-right text-ink-faint whitespace-nowrap">{money(p.cost)}</td>
                      <td className="py-2.5 px-2 text-right text-ink whitespace-nowrap">{money(p.ours)}</td>
                      <td className="py-2.5 px-2">
                        <div className="flex justify-end">
                          <MarginInput
                            value={line.margin}
                            onChange={(v) => setMargin(line.wine.code, v)}
                            label={`Margin for ${line.wine.description}`}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right text-ink whitespace-nowrap">{money(p.listEx)}</td>
                      <td className="py-2.5 px-2 text-right text-gold whitespace-nowrap">{money(p.listInc)}</td>
                      <td className="py-2.5 px-2 text-right text-ink-soft whitespace-nowrap">{money(p.profit)}</td>
                      <td className="py-2.5 pr-5 sm:pr-0 text-right">
                        <button
                          type="button"
                          onClick={() => remove(line.wine.code)}
                          className="rounded-md p-1.5 text-ink-faint hover:bg-raised hover:text-danger"
                          aria-label={`Remove ${line.wine.description}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {lines.length > 0 && (
            <dl className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-cream p-4 text-center">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">Wines</dt>
                <dd className="mt-1 font-display text-[22px] text-gold">{lines.length}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">Average margin</dt>
                <dd className="mt-1 font-display text-[22px] text-gold">{averageMargin}%</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">Their profit, 1 of each</dt>
                <dd className="mt-1 font-display text-[22px] text-gold">{money(totalProfit)}</dd>
              </div>
            </dl>
          )}

          {message && (
            <Alert tone={message.tone} className="mt-4">
              {message.text}
            </Alert>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={preview}
              loading={busy === "pdf"}
              disabled={!lines.length || invalid || busy !== null}
            >
              <FileDown className="h-4 w-4" /> Download PDF
            </Button>
            <Button onClick={send} loading={busy === "send"} disabled={!lines.length || invalid || busy !== null}>
              <Send className="h-4 w-4" /> Email proposal
            </Button>
            {(lines.length > 0 || customer.email) && (
              <Button variant="ghost" onClick={startNew} disabled={busy !== null} className="ml-auto">
                Start a new proposal
              </Button>
            )}
          </div>
          {invalid && (
            <p className="mt-2 text-[12px] text-danger">Give every wine a margin between 0% and 1000%.</p>
          )}
          <p className="mt-3 text-[12px] text-ink-faint">
            The PDF shows our price and the list price at the restaurant&apos;s margin, never our cost. Prices are
            valid for {access.valid_days} days.
          </p>
        </section>

        <Recent refreshKey={sentCount} />
      </div>
    </div>
  );
}

export default function ProposalsPage() {
  const { state, proposals } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state === "anonymous") router.replace("/login?next=/proposals");
  }, [state, router]);

  if (state !== "signed-in") return <PageSpinner />;
  if (!proposals) return <NotForYou />;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-[36px] sm:text-[44px] leading-tight font-medium text-white">
        Wine list proposals
      </h1>
      <p className="mt-1 mb-8 text-[14px] text-ink-soft max-w-2xl">
        Choose wines, set the restaurant&apos;s margin on each, and email them a Vintage Associates proposal as a
        PDF. Only the team can see this page.
      </p>
      <ProposalBuilder access={proposals} />
    </main>
  );
}
