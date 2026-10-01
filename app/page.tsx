"use client";

import { CalendarClock, FileText, Grape, Package, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { ButtonLink } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const STEPS = [
  {
    icon: FileText,
    title: "Apply in two minutes",
    body: "Tell us about your restaurant. We review every application, usually within one working day.",
  },
  {
    icon: Grape,
    title: "Browse the full list",
    body: "Over 2,300 wines from 25 countries, with tasting notes, grapes, ABV, closure and producer stories.",
  },
  {
    icon: Package,
    title: "Order bottles or cases",
    body: "Single bottles or cases of 3, 6 and 12. Every price includes VAT, so there are no surprises.",
  },
  {
    icon: CalendarClock,
    title: "Pay within 30 days",
    body: "Each order is invoiced by email. Pay by card or bank transfer from the invoice link.",
  },
];

export default function Home() {
  const { state, account } = useAuth();
  const router = useRouter();

  // Approved restaurants go straight to the list.
  useEffect(() => {
    if (state === "signed-in" && account?.status === "approved") router.replace("/wines");
  }, [state, account, router]);

  return (
    <main>
      <section className="relative overflow-hidden bg-deep text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #C4AD93 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, #C4AD93 0 1.5px, transparent 2.5px)",
            backgroundSize: "42px 42px, 58px 58px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-28 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div>
            <p className="text-gold text-[12px] uppercase tracking-[0.35em]">For restaurants &amp; hospitality</p>
            <h1 className="mt-4 font-display text-[42px] sm:text-[56px] lg:text-[64px] leading-[1.02] font-medium">
              Your wine list,
              <br />
              <span className="text-gold">on account.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[16px] sm:text-[18px] text-ink">
              Order from the full Vintage Associates trade list in a few taps. Bottles or cases, prices that include
              VAT, and an invoice with 30 days to pay.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/apply" variant="gold" size="lg">
                Apply for a trade account
              </ButtonLink>
              <ButtonLink
                href="/login"
                size="lg"
                className="bg-transparent text-white border border-white/30 hover:bg-white/5"
              >
                Log in
              </ButtonLink>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-3xl bg-white/[0.03] ring-1 ring-white/10 p-6 backdrop-blur-sm">
              <p className="text-[12px] uppercase tracking-[0.25em] text-gold">Order summary</p>
              <ul className="mt-4 space-y-3 text-[14px]">
                {[
                  ["Verdicchio di Matelica 2024", "Case of 6"],
                  ["Ribeiro Treixadura 2024", "Case of 12"],
                  ["Swartland Estate Red 2024", "Case of 3"],
                ].map(([name, fmt]) => (
                  <li key={name} className="flex justify-between gap-4 border-b border-white/10 pb-3">
                    <span className="font-display text-[18px]">{name}</span>
                    <span className="text-ink-faint whitespace-nowrap">{fmt}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-surface text-white ring-1 ring-white/10 px-4 py-3">
                <Truck className="h-5 w-5 text-gold-dark" />
                <div className="text-[13px]">
                  <p className="font-semibold">Invoice emailed on ordering</p>
                  <p className="text-ink-soft">Payment due in 30 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="font-display text-[34px] sm:text-[40px] font-medium text-white text-center">How it works</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="rounded-2xl bg-surface p-6 shadow-card ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-light text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-display text-[28px] text-gold">{i + 1}</span>
              </div>
              <h3 className="mt-4 text-[17px] font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-[14px] text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <ButtonLink href="/apply" size="lg">
            Get started
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
