"use client";

import { CalendarClock, FileText, Lock, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { LineThumb, lineDetail } from "@/components/BasketDrawer";
import Gate from "@/components/Gate";
import { MinimumOrderNote, VatBreakdown, underMinimum } from "@/components/OrderTotals";
import { Alert, Button, ButtonLink, Field, PageSpinner, TextArea } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useBasket } from "@/lib/basket";
import { homePath, isMember, minimumOrderFor, money } from "@/lib/format";
import type { FormatCode, Order } from "@/lib/types";

interface Quote {
  lines: {
    product_code: string;
    format: FormatCode;
    quantity: number;
    unit_price: string;
    line_total: string;
    vat_included: boolean;
  }[];
  /** Before VAT. */
  subtotal: string;
  vat_amount: string;
  /** Including VAT. */
  total: string;
  /** Inc VAT. */
  minimum_order_total: string;
}

function Checkout() {
  const { account } = useAuth();
  const basket = useBasket();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [priceChanged, setPriceChanged] = useState(false);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const placed = useRef(false);

  const defaultAddress = useMemo(() => {
    if (!account) return "";
    const delivery = [account.delivery_line1, account.delivery_line2, account.delivery_city, account.delivery_postcode].filter(Boolean);
    const billing = [account.billing_line1, account.billing_line2, account.billing_city, account.billing_postcode].filter(Boolean);
    return [account.trading_name || account.business_name, ...(delivery.length ? delivery : billing)].join("\n");
  }, [account]);

  const [address, setAddress] = useState(defaultAddress);
  const [contactName, setContactName] = useState(account?.contact_name ?? "");
  const [contactPhone, setContactPhone] = useState(account?.phone ?? "");
  const [po, setPo] = useState("");
  const [notes, setNotes] = useState(account?.delivery_instructions ?? "");

  useEffect(() => setAddress(defaultAddress), [defaultAddress]);

  const items = basket.lines.map((l) => ({ product_code: l.product_code, format: l.format, quantity: l.quantity }));
  const itemsKey = JSON.stringify(items);

  // Re-price the basket against today's prices before showing the total.
  useEffect(() => {
    if (!basket.ready || placed.current) return;
    if (!items.length) {
      setQuote(null);
      return;
    }
    api<Quote>("/api/trade/quote/", { method: "POST", body: { items } })
      .then((q) => {
        setProblems([]);
        const changed = q.lines.some((ql) => {
          const line = basket.lines.find((l) => l.product_code === ql.product_code && l.format === ql.format);
          return line && line.unit_price !== ql.unit_price;
        });
        if (changed) {
          setPriceChanged(true);
          basket.replacePrices(q.lines);
        }
        setQuote(q);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 400) {
          const fe = err.data as { items?: string[] };
          setProblems(fe?.items ?? [err.message]);
        } else setError(err.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, basket.ready]);

  if (!basket.ready) return <PageSpinner />;

  if (!basket.lines.length && !placed.current) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="font-display text-[28px] text-white">Your basket is empty</p>
        <ButtonLink href={homePath(account)} variant="secondary" className="mt-6">
          {account?.wines_enabled === false ? "Browse glassware" : "Browse wines"}
        </ButtonLink>
      </main>
    );
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    setPlacing(true);
    try {
      const order = await api<Order>("/api/trade/orders/", {
        method: "POST",
        body: {
          items,
          delivery_address: address,
          contact_name: contactName,
          contact_phone: contactPhone,
          po_number: po,
          notes,
        },
      });
      placed.current = true;
      basket.clear();
      router.replace(`/orders/${order.id}?placed=1`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const fe = err.data as { items?: string[] };
        if (fe?.items) setProblems(fe.items);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "We couldn't place your order.");
      }
      setPlacing(false);
    }
  };

  const subtotal = quote ? Number(quote.subtotal) : basket.subtotal;
  const total = quote ? Number(quote.total) : basket.total;
  const vat = quote ? Number(quote.vat_amount) : basket.vat;
  const minimum = quote ? Number(quote.minimum_order_total) : minimumOrderFor(account);
  const belowMinimum = underMinimum(total, minimum);
  const terms = account?.payment_terms_days ?? 30;
  const invoiceTo = account?.accounts_email || account?.email;
  // Members aren't invoiced here: we take the order and bill them separately.
  const member = isMember(account);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 pb-28">
      <h1 className="font-display text-[38px] sm:text-[44px] font-medium text-white">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5 order-2 lg:order-1">
          {problems.length > 0 && (
            <Alert tone="error">
              <p className="font-medium">Some items need your attention:</p>
              <ul className="mt-1 list-disc pl-5">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="mt-2">Remove them from your basket to continue.</p>
            </Alert>
          )}

          <section className="rounded-2xl bg-surface p-5 sm:p-6 shadow-card ring-1 ring-white/10">
            <h2 className="font-display text-[24px] font-medium text-white">Delivery</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextArea
                className="sm:col-span-2"
                label="Delivery address"
                name="delivery_address"
                rows={5}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Field label="Contact name" name="contact_name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              <Field
                label="Contact phone"
                name="contact_phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
              <TextArea
                className="sm:col-span-2"
                label="Delivery notes (optional)"
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Delivery window, access, anything we should know"
              />
            </div>
          </section>

          {member ? (
            <section className="rounded-2xl bg-surface p-5 sm:p-6 shadow-card ring-1 ring-white/10">
              <h2 className="font-display text-[24px] font-medium text-white">Payment</h2>
              <div className="mt-4 flex gap-3 rounded-xl border border-gold/50 bg-gold-light/40 p-4 text-[14px]">
                <Phone className="h-5 w-5 shrink-0 text-gold-dark" />
                <p>
                  There&apos;s nothing to pay now. We&apos;ll confirm your order and a member of our team will be in
                  touch to arrange delivery and billing.
                </p>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl bg-surface p-5 sm:p-6 shadow-card ring-1 ring-white/10">
              <h2 className="font-display text-[24px] font-medium text-white">Invoice</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Your PO / reference (optional)"
                  name="po_number"
                  value={po}
                  onChange={(e) => setPo(e.target.value)}
                  hint="Shown on the invoice"
                />
                <div className="rounded-xl bg-[#202224] ring-1 ring-white/10 p-4 text-[14px]">
                  <p className="text-ink-faint text-[12px]">Invoice to</p>
                  <p className="font-medium">{account?.business_name}</p>
                  <p className="text-ink-soft break-all">{invoiceTo}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 text-[14px]">
                <div className="flex gap-3 rounded-xl border border-gold/50 bg-gold-light/40 p-4">
                  <FileText className="h-5 w-5 shrink-0 text-gold-dark" />
                  <p>
                    We&apos;ll email your invoice to <b className="break-all">{invoiceTo}</b> as soon as you place the order.
                  </p>
                </div>
                <div className="flex gap-3 rounded-xl border border-gold/50 bg-gold-light/40 p-4">
                  <CalendarClock className="h-5 w-5 shrink-0 text-gold-dark" />
                  <p>
                    Payment is due within <b>{terms} days</b>, by card or bank transfer from the invoice link.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-[108px] rounded-2xl bg-surface shadow-card ring-1 ring-white/10">
            <div className="p-5 border-b border-white/10 flex items-baseline justify-between">
              <h2 className="font-display text-[24px] font-medium text-white">Your order</h2>
              <Link href="/basket" className="text-[13px] text-gold underline">
                Edit
              </Link>
            </div>
            {priceChanged && (
              <Alert tone="warning" className="m-4 mb-0">
                Some prices have changed since you added them. The total below uses today&apos;s prices.
              </Alert>
            )}
            <ul className="max-h-[42vh] overflow-y-auto px-5 divide-y divide-white/10">
              {basket.lines.map((l) => (
                <li key={`${l.product_code}-${l.format}`} className="flex gap-3 py-3">
                  <div className="w-10 h-14 shrink-0 rounded-md bg-[#202224] grid place-items-center">
                    <LineThumb line={l} className="h-12 w-8" />
                  </div>
                  <div className="flex-1 min-w-0 text-[13px]">
                    <p className="font-medium leading-snug line-clamp-2">{l.name}</p>
                    <p className="text-ink-faint">
                      {l.quantity} × {lineDetail(l)} · {money(l.unit_price)}
                      {l.format === "accessory" ? " inc VAT" : " ex VAT"}
                    </p>
                  </div>
                  <p className="text-[14px] font-medium whitespace-nowrap">{money(Number(l.unit_price) * l.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="p-5 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-[14px] text-ink-soft">
                <span>Bottles</span>
                <span>{basket.bottles}</span>
              </div>
              {basket.accessories > 0 && (
                <div className="flex justify-between text-[14px] text-ink-soft">
                  <span>Accessories</span>
                  <span>{basket.accessories}</span>
                </div>
              )}
              <VatBreakdown subtotal={subtotal} vat={vat} total={total} />
              {basket.accessories > 0 && (
                <p className="text-[12px] text-ink-faint">Glassware prices already include VAT; wine has 20% VAT added.</p>
              )}
              <MinimumOrderNote total={total} minimum={minimum} />
              {error && <Alert tone="error">{error}</Alert>}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={placing}
                disabled={problems.length > 0 || !quote || belowMinimum}
              >
                <Lock className="h-4 w-4" />
                {member ? "Place order" : `Place order · pay in ${terms} days`}
              </Button>
              <p className="text-center text-[12px] text-ink-faint">
                {member
                  ? "We'll be in touch to arrange billing."
                  : `By placing this order you agree to pay the invoice within ${terms} days.`}
              </p>
            </div>
          </div>
        </aside>
      </form>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Gate>
      <Checkout />
    </Gate>
  );
}
