"use client";

import clsx from "clsx";
import { ChevronDown, Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { typeColour, typeLabel } from "@/lib/format";
import type { Facet, Facets } from "@/lib/types";

export interface FilterState {
  q: string;
  sort: string;
  type: string[];
  country: string[];
  region: string[];
  grape: string[];
  producer: string[];
  closure: string[];
  size: string[];
  organic: boolean;
  vegan: boolean;
  priced: boolean;
  min_price: string;
  max_price: string;
}

export const EMPTY_FILTERS: FilterState = {
  q: "",
  sort: "name",
  type: [],
  country: [],
  region: [],
  grape: [],
  producer: [],
  closure: [],
  size: [],
  organic: false,
  vegan: false,
  priced: false,
  min_price: "",
  max_price: "",
};

export const LIST_KEYS = ["type", "country", "region", "grape", "producer", "closure", "size"] as const;
type ListKey = (typeof LIST_KEYS)[number];

export function activeFilterCount(f: FilterState): number {
  return (
    LIST_KEYS.reduce((n, k) => n + f[k].length, 0) +
    (f.organic ? 1 : 0) +
    (f.vegan ? 1 : 0) +
    (f.priced ? 1 : 0) +
    (f.min_price ? 1 : 0) +
    (f.max_price ? 1 : 0)
  );
}

function Group({
  title,
  children,
  defaultOpen = true,
  count,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10 py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">
          {title}
          {count ? <span className="ml-1.5 text-gold-dark">({count})</span> : null}
        </span>
        <ChevronDown className={clsx("h-4 w-4 text-ink-faint transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function CheckList({
  options,
  selected,
  onToggle,
  searchable = false,
  limit = 8,
  swatch,
}: {
  options: Facet[];
  selected: string[];
  onToggle: (value: string) => void;
  searchable?: boolean;
  limit?: number;
  swatch?: (value: string) => string;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? options.filter((o) => o.value.toLowerCase().includes(q)) : options;
    // Keep ticked options visible even when the list is collapsed.
    const chosen = list.filter((o) => selected.includes(o.value));
    const rest = list.filter((o) => !selected.includes(o.value));
    return [...chosen, ...rest];
  }, [options, query, selected]);
  const visible = showAll || query ? filtered : filtered.slice(0, Math.max(limit, selected.length));

  return (
    <div>
      {searchable && (
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full h-9 rounded-lg border border-white/15 bg-surface pl-8 pr-2 text-[13px] outline-none focus:border-gold"
          />
        </div>
      )}
      <ul className="space-y-0.5">
        {visible.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <li key={o.value}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[14px] hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(o.value)}
                  className="h-4 w-4 shrink-0 accent-[#C4AD93]"
                />
                {swatch && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: swatch(o.value) }} />}
                <span className={clsx("flex-1 truncate", checked && "font-medium text-gold")}>{o.value}</span>
                <span className="text-[12px] text-ink-faint">{o.count}</span>
              </label>
            </li>
          );
        })}
        {visible.length === 0 && <li className="px-1.5 text-[13px] text-ink-faint">No matches</li>}
      </ul>
      {!query && filtered.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-2 px-1.5 text-[13px] font-medium text-gold hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${filtered.length}`}
        </button>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange, count }: { label: string; checked: boolean; onChange: (v: boolean) => void; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg px-1.5 py-1.5 text-[14px] hover:bg-white/5">
      <span>
        {label}
        {count !== undefined && <span className="ml-1.5 text-[12px] text-ink-faint">{count}</span>}
      </span>
      <span
        className={clsx(
          "relative inline-flex h-6 w-10 items-center rounded-full transition-colors",
          checked ? "bg-gold" : "bg-white/15"
        )}
      >
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={clsx("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
      </span>
    </label>
  );
}

export default function Filters({
  facets,
  value,
  onChange,
}: {
  facets: Facets | null;
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  if (!facets) {
    return (
      <div className="space-y-3 animate-pulse py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-5 rounded bg-raised" />
        ))}
      </div>
    );
  }

  const toggle = (key: ListKey) => (item: string) => {
    const list = value[key];
    const nextList = list.includes(item) ? list.filter((v) => v !== item) : [...list, item];
    const next = { ...value, [key]: nextList };
    // Regions only make sense within the chosen countries.
    if (key === "country") {
      const allowed = new Set(nextList.flatMap((c) => (facets.regions[c] || []).map((r) => r.value)));
      next.region = nextList.length ? value.region.filter((r) => allowed.has(r)) : value.region;
    }
    onChange(next);
  };

  const regionOptions: Facet[] = value.country.length
    ? value.country.flatMap((c) => facets.regions[c] || [])
    : Object.values(facets.regions).flat();
  const regionsSorted = [...regionOptions].sort((a, b) => b.count - a.count);

  return (
    <div>
      <Group title="Type" count={value.type.length}>
        <CheckList
          options={[...facets.types].sort((a, b) => b.count - a.count)}
          selected={value.type}
          onToggle={toggle("type")}
          swatch={typeColour}
          limit={14}
        />
      </Group>
      <Group title="Country" count={value.country.length}>
        <CheckList
          options={[...facets.countries].sort((a, b) => b.count - a.count)}
          selected={value.country}
          onToggle={toggle("country")}
          limit={8}
        />
      </Group>
      <Group title="Region" count={value.region.length} defaultOpen={value.country.length > 0 || value.region.length > 0}>
        <CheckList options={regionsSorted} selected={value.region} onToggle={toggle("region")} searchable limit={8} />
      </Group>
      <Group title="Grape" count={value.grape.length} defaultOpen={value.grape.length > 0}>
        <CheckList options={facets.grapes} selected={value.grape} onToggle={toggle("grape")} searchable limit={10} />
      </Group>
      <Group title="Producer" count={value.producer.length} defaultOpen={value.producer.length > 0}>
        <CheckList
          options={[...facets.producers].sort((a, b) => a.value.localeCompare(b.value))}
          selected={value.producer}
          onToggle={toggle("producer")}
          searchable
          limit={8}
        />
      </Group>
      <Group title="Price per bottle" defaultOpen={Boolean(value.min_price || value.max_price)}>
        <div className="flex items-center gap-2">
          {(["min_price", "max_price"] as const).map((k, i) => (
            <React.Fragment key={k}>
              {i === 1 && <span className="text-ink-faint">–</span>}
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-ink-faint">£</span>
                <input
                  inputMode="decimal"
                  value={value[k]}
                  onChange={(e) => onChange({ ...value, [k]: e.target.value.replace(/[^\d.]/g, "") })}
                  placeholder={k === "min_price" ? "Min" : "Max"}
                  aria-label={k === "min_price" ? "Minimum price" : "Maximum price"}
                  className="w-full h-9 rounded-lg border border-white/15 bg-surface pl-6 pr-2 text-[13px] outline-none focus:border-gold"
                />
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="mt-2">
          <Toggle label="Priced wines only" checked={value.priced} onChange={(v) => onChange({ ...value, priced: v })} />
        </div>
      </Group>
      <Group title="Credentials">
        <Toggle label="Organic" count={facets.organic} checked={value.organic} onChange={(v) => onChange({ ...value, organic: v })} />
        <Toggle label="Vegan" count={facets.vegan} checked={value.vegan} onChange={(v) => onChange({ ...value, vegan: v })} />
      </Group>
      <Group title="Bottle size" count={value.size.length} defaultOpen={value.size.length > 0}>
        <CheckList options={facets.sizes} selected={value.size} onToggle={toggle("size")} limit={12} />
      </Group>
      <Group title="Closure" count={value.closure.length} defaultOpen={value.closure.length > 0}>
        <CheckList options={facets.closures} selected={value.closure} onToggle={toggle("closure")} limit={12} />
      </Group>
    </div>
  );
}

/** Removable chips for every active filter. */
export function ActiveChips({ value, onChange }: { value: FilterState; onChange: (next: FilterState) => void }) {
  const chips: { label: string; clear: () => FilterState }[] = [];
  for (const key of LIST_KEYS) {
    for (const item of value[key]) {
      chips.push({
        label: key === "type" ? typeLabel(item) : item,
        clear: () => ({ ...value, [key]: value[key].filter((v) => v !== item) }),
      });
    }
  }
  if (value.organic) chips.push({ label: "Organic", clear: () => ({ ...value, organic: false }) });
  if (value.vegan) chips.push({ label: "Vegan", clear: () => ({ ...value, vegan: false }) });
  if (value.priced) chips.push({ label: "Priced only", clear: () => ({ ...value, priced: false }) });
  if (value.min_price) chips.push({ label: `From £${value.min_price}`, clear: () => ({ ...value, min_price: "" }) });
  if (value.max_price) chips.push({ label: `Up to £${value.max_price}`, clear: () => ({ ...value, max_price: "" }) });
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.label}
          onClick={() => onChange(c.clear())}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-[13px] text-gold ring-1 ring-gold/30 hover:bg-gold/20"
        >
          {c.label}
          <span aria-hidden className="text-[15px] leading-none">×</span>
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <button
        onClick={() => onChange({ ...EMPTY_FILTERS, q: value.q, sort: value.sort })}
        className="text-[13px] text-ink-soft underline hover:text-gold"
      >
        Clear all
      </button>
    </div>
  );
}
