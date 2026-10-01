"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Gate from "@/components/Gate";
import { Alert, Button, ButtonLink, PageSpinner, PaymentBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, isOverdue, money, paymentLabel } from "@/lib/format";
import type { Order, Paginated } from "@/lib/types";

function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    api<Paginated<Order>>("/api/trade/orders/", { query: { page: 1 } })
      .then((d) => {
        setOrders(d.results);
        setTotalPages(d.total_pages);
      })
      .catch((err) => setError(err.message));
  }, []);

  const more = async () => {
    setLoadingMore(true);
    try {
      const d = await api<Paginated<Order>>("/api/trade/orders/", { query: { page: page + 1 } });
      setOrders((o) => [...(o ?? []), ...d.results]);
      setPage(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  if (error) return <Alert tone="error" className="m-6">{error}</Alert>;
  if (!orders) return <PageSpinner />;

  const outstanding = orders
    .filter((o) => o.payment_status === "invoiced" || o.payment_status === "overdue")
    .reduce((s, o) => s + Number(o.total), 0);

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[38px] sm:text-[44px] font-medium text-white">Orders &amp; invoices</h1>
          {outstanding > 0 && (
            <p className="mt-1 text-[14px] text-ink-soft">
              Awaiting payment: <b className="text-ink">{money(outstanding)}</b>
            </p>
          )}
        </div>
        <ButtonLink href="/wines" variant="secondary" size="sm">
          New order
        </ButtonLink>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-surface p-10 text-center ring-1 ring-white/10">
          <p className="font-display text-[24px] text-white">No orders yet</p>
          <p className="mt-2 text-[14px] text-ink-soft">Your orders and invoices will appear here.</p>
          <ButtonLink href="/wines" className="mt-6">
            Browse wines
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((o) => {
            const overdue = isOverdue(o);
            return (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center gap-4 rounded-2xl bg-surface p-4 sm:p-5 shadow-card ring-1 ring-white/10 hover:ring-gold/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{o.reference}</span>
                      <PaymentBadge status={overdue ? "overdue" : o.payment_status} label={paymentLabel(o)} />
                    </div>
                    <p className="mt-1 text-[13px] text-ink-soft">
                      {formatDate(o.created_at)} · {o.total_bottles} bottle{o.total_bottles === 1 ? "" : "s"}
                      {o.po_number && <> · PO {o.po_number}</>}
                    </p>
                    {o.payment_status !== "paid" && o.due_date && o.payment_status !== "void" && (
                      <p className={`mt-0.5 text-[13px] ${overdue ? "text-danger font-medium" : "text-ink-faint"}`}>
                        Due {formatDate(o.due_date)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[22px] font-medium text-white">{money(o.total)}</p>
                    <p className="text-[11px] text-ink-faint">inc VAT</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-ink-faint shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {page < totalPages && (
        <div className="mt-6 text-center">
          <Button variant="secondary" onClick={more} loading={loadingMore}>
            Show older orders
          </Button>
        </div>
      )}
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Gate>
      <Orders />
    </Gate>
  );
}
