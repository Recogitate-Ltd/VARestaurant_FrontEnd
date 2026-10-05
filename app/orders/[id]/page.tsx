"use client";

import { ArrowLeft, CheckCircle2, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import BottleImage from "@/components/BottleImage";
import { VatBreakdown } from "@/components/OrderTotals";
import Gate from "@/components/Gate";
import { Alert, PageSpinner, PaymentBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SUPPORT_EMAIL, SUPPORT_PHONE, formatDate, isOverdue, money, paymentLabel } from "@/lib/format";
import type { Order } from "@/lib/types";

function OrderView() {
  const { id } = useParams<{ id: string }>();
  const justPlaced = useSearchParams().get("placed") === "1";
  const { account } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Order>(`/api/trade/orders/${id}/`)
      .then(setOrder)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <Alert tone="error" className="m-6">{error}</Alert>;
  if (!order) return <PageSpinner />;

  const overdue = isOverdue(order);
  const invoiceTo = account?.accounts_email || account?.email;
  const unpaid = ["invoiced", "overdue"].includes(order.payment_status);

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-10">
      {justPlaced ? (
        <div className="rounded-3xl bg-deep text-white p-6 sm:p-8">
          <CheckCircle2 className="h-10 w-10 text-gold" />
          <h1 className="mt-3 font-display text-[34px] sm:text-[40px] leading-tight font-medium">Thank you, your order is in</h1>
          <p className="mt-2 text-[15px] text-ink">
            Order <b className="text-white">{order.reference}</b> has been placed.{" "}
            {order.payment_status === "bill_separately"
              ? "There's nothing to pay now: a member of our team will be in touch to arrange delivery and billing."
              : `${
                  order.hosted_invoice_url
                    ? `We've emailed the invoice to ${invoiceTo}, with payment due by ${formatDate(order.due_date)}.`
                    : `Your invoice will follow by email to ${invoiceTo} shortly.`
                } We'll be in touch to arrange delivery.`}
          </p>
        </div>
      ) : (
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-[14px] text-ink-soft hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> All orders
        </Link>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-[30px] font-medium text-white">{order.reference}</h2>
        <PaymentBadge status={overdue ? "overdue" : order.payment_status} label={paymentLabel(order)} />
      </div>
      <p className="text-[14px] text-ink-soft">
        Placed {formatDate(order.created_at)}
        {order.po_number && <> · PO {order.po_number}</>}
        {order.stripe_invoice_number && <> · Invoice {order.stripe_invoice_number}</>}
      </p>

      {(order.hosted_invoice_url || order.invoice_pdf_url) && (
        <div className={`mt-5 rounded-2xl p-5 ring-1 ${overdue ? "bg-danger/10 ring-danger/40" : "bg-surface ring-white/10 shadow-card"}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-[14px]">
              {order.payment_status === "paid" ? (
                <p>
                  <b>Paid</b> on {formatDate(order.paid_at)}. Thank you.
                </p>
              ) : unpaid ? (
                <p>
                  <b className={overdue ? "text-danger" : ""}>{money(order.total)}</b> due by{" "}
                  <b className={overdue ? "text-danger" : ""}>{formatDate(order.due_date)}</b>
                  {overdue && " — this invoice is overdue"}
                </p>
              ) : (
                <p>Invoice {order.payment_status_label.toLowerCase()}.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {order.hosted_invoice_url && (
                <a
                  href={order.hosted_invoice_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-gold px-4 text-[14px] text-black hover:bg-gold-dim"
                >
                  {unpaid ? "Pay invoice" : "View invoice"} <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {order.invoice_pdf_url && (
                <a
                  href={order.invoice_pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-gold/50 bg-surface px-4 text-[14px] text-gold hover:border-gold"
                >
                  <Download className="h-4 w-4" /> PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="mt-6 rounded-2xl bg-surface shadow-card ring-1 ring-white/10">
        <ul className="divide-y divide-white/10 px-5">
          {order.items?.map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="w-12 h-16 shrink-0 rounded-lg bg-[#202224] grid place-items-center">
                {item.item_type === "accessory" ? (
                  <BottleImage
                    src={item.image_url}
                    alt=""
                    type="accessory"
                    className="h-14 w-10 rounded-md bg-[#F3EFE9] p-1"
                  />
                ) : (
                  <BottleImage src={item.image_url} alt="" type="" className="h-14 w-9" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/${item.item_type === "accessory" ? "accessories" : "wines"}/${encodeURIComponent(item.product_code)}`}
                  className="font-display text-[18px] leading-tight font-medium hover:text-gold"
                >
                  {item.wine_name}
                </Link>
                <p className="text-[13px] text-ink-soft">
                  {item.quantity} × {item.format_label}
                  {item.size ? ` · ${item.size}` : ""} · {money(item.unit_price)} each{" "}
                  {item.vat_included ? "inc VAT" : "ex VAT"}
                </p>
                <p className="text-[12px] text-ink-faint">
                  {item.item_type === "accessory"
                    ? `${item.producer} · ${item.product_code}`
                    : `${item.bottles} bottle${item.bottles === 1 ? "" : "s"} · ${item.product_code}`}
                </p>
              </div>
              <p className="text-[15px] font-semibold whitespace-nowrap">{money(item.line_total)}</p>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 p-5 space-y-1.5">
          <p className="text-[14px] text-ink-soft">
            {order.total_bottles} bottle{order.total_bottles === 1 ? "" : "s"}
          </p>
          <VatBreakdown
            subtotal={order.subtotal}
            vat={order.vat_amount}
            total={order.total}
            totalClassName="text-[28px]"
          />
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-white/10 text-[14px]">
          <p className="text-[12px] uppercase tracking-[0.12em] text-ink-faint">Delivery to</p>
          <p className="mt-2 whitespace-pre-line">{order.delivery_address}</p>
          {(order.contact_name || order.contact_phone) && (
            <p className="mt-2 text-ink-soft">
              {order.contact_name} {order.contact_phone && `· ${order.contact_phone}`}
            </p>
          )}
          <p className="mt-3 text-ink-soft">Status: {order.fulfilment_status_label}</p>
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-white/10 text-[14px]">
          <p className="text-[12px] uppercase tracking-[0.12em] text-ink-faint">Notes</p>
          <p className="mt-2 whitespace-pre-line">{order.notes || "—"}</p>
          <p className="mt-4 text-ink-soft">
            Need to change something? Call {SUPPORT_PHONE} or email{" "}
            <a className="underline" href={`mailto:${SUPPORT_EMAIL}?subject=Order ${order.reference}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

export default function OrderPage() {
  return (
    <Gate>
      <Suspense>
        <OrderView />
      </Suspense>
    </Gate>
  );
}
