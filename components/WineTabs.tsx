"use client";

import Link from "next/link";
import React from "react";
import { useAuth } from "@/lib/auth";
import { seesFineAndRare } from "@/lib/format";

export type WineTab = "mine" | "all" | "fine";

const TAB = "h-9 inline-flex shrink-0 items-center whitespace-nowrap rounded-lg px-3.5 sm:px-4 text-[14px]";
const ACTIVE = `${TAB} bg-gold text-black`;
const IDLE = `${TAB} text-ink-soft hover:text-white`;

/**
 * "My wines · All wines · Fine & Rare" above the wine lists. The first two
 * switch the catalogue view in place (``onSelect``); Fine & Rare is its own
 * page and only shows for restaurant accounts.
 */
export default function WineTabs({
  active,
  myWinesCount,
  onSelect,
}: {
  active: WineTab;
  myWinesCount?: number | null;
  onSelect?: (tab: "mine" | "all") => void;
}) {
  const { account } = useAuth();
  const tabs: { value: WineTab; label: string; href: string }[] = [
    {
      value: "mine",
      label: `My wines${active === "mine" && myWinesCount != null ? ` (${myWinesCount})` : ""}`,
      href: "/wines",
    },
    { value: "all", label: "All wines", href: "/wines?view=all" },
    ...(seesFineAndRare(account) ? [{ value: "fine" as const, label: "Fine & Rare", href: "/fine-and-rare" }] : []),
  ];
  return (
    <div role="tablist" aria-label="Which wines" className="mt-5 inline-flex max-w-full overflow-x-auto rounded-xl border border-white/15 bg-black/20 p-1">
      {tabs.map((t) =>
        onSelect && t.value !== "fine" ? (
          <button
            key={t.value}
            role="tab"
            aria-selected={active === t.value}
            onClick={() => onSelect(t.value as "mine" | "all")}
            className={active === t.value ? ACTIVE : IDLE}
          >
            {t.label}
          </button>
        ) : (
          <Link
            key={t.value}
            role="tab"
            aria-selected={active === t.value}
            href={t.href}
            className={active === t.value ? ACTIVE : IDLE}
          >
            {t.label}
          </Link>
        )
      )}
    </div>
  );
}
