"use client";

import { Download } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Alert } from "@/components/ui";
import { api, downloadFile } from "@/lib/api";
import { formatDate, money } from "@/lib/format";
import type { Paginated, Statement } from "@/lib/types";

function monthName(month: string): string {
  const [year, m] = month.split("-").map(Number);
  if (!year || !m) return month;
  return new Date(year, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** The monthly statements we've emailed this restaurant, to download again. Hidden until there is one. */
export default function Statements() {
  const [statements, setStatements] = useState<Statement[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Paginated<Statement>>("/api/trade/statements/")
      .then((data) => setStatements(data.results))
      .catch(() => setStatements([]));
  }, []);

  if (!statements || statements.length === 0) return null;

  const download = async (s: Statement) => {
    setError("");
    try {
      await downloadFile(`/api/trade/statements/${s.id}/pdf/`, `Vintage Associates statement ${monthName(s.month)}.pdf`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="mt-6 rounded-2xl bg-surface p-5 sm:p-6 shadow-card ring-1 ring-white/10 text-[14px]">
      <h2 className="font-display text-[24px] font-medium text-white">Statements</h2>
      <p className="mt-1 text-ink-soft">
        We email a statement at the end of each month. Downloads show any payments received since.
      </p>
      <ul className="mt-4 divide-y divide-white/10">
        {statements.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium text-white">{monthName(s.month)}</p>
              <p className="text-[13px] text-ink-soft">
                {s.invoice_count} invoice{s.invoice_count === 1 ? "" : "s"} · balance {money(s.balance_due)} · due{" "}
                {formatDate(s.due_date)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => download(s)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-gold/50 px-4 text-[13px] text-gold hover:border-gold"
            >
              <Download className="h-4 w-4" /> PDF
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      )}
    </section>
  );
}
