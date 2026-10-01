"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Alert, Button, ButtonLink, Field, TextArea } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const EMPTY = {
  business_name: "",
  trading_name: "",
  company_number: "",
  vat_number: "",
  contact_name: "",
  phone: "",
  email: "",
  accounts_email: "",
  password: "",
  billing_line1: "",
  billing_line2: "",
  billing_city: "",
  billing_postcode: "",
  delivery_line1: "",
  delivery_line2: "",
  delivery_city: "",
  delivery_postcode: "",
  delivery_instructions: "",
};

type Form = typeof EMPTY;

function Section({ title, children, note }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl bg-surface p-5 sm:p-6 shadow-card ring-1 ring-white/10">
      <legend className="sr-only">{title}</legend>
      <h2 className="font-display text-[24px] font-medium text-white">{title}</h2>
      {note && <p className="mt-1 text-[13px] text-ink-soft">{note}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default function ApplyPage() {
  const { login } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [sameDelivery, setSameDelivery] = useState(true);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const bind = (name: keyof Form) => ({
    name,
    value: form[name],
    error: errors[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [name]: e.target.value })),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrors({});
    if (!agree) {
      setError("Please confirm the business is licensed to sell alcohol and that you accept 30-day payment terms.");
      return;
    }
    setSubmitting(true);
    const body: Partial<Form> = { ...form };
    if (sameDelivery) {
      body.delivery_line1 = "";
      body.delivery_line2 = "";
      body.delivery_city = "";
      body.delivery_postcode = "";
    }
    try {
      await api("/api/trade/apply/", { method: "POST", body, auth: false });
      // Sign them in so they can see their application status straight away.
      await login(form.email, form.password).catch(() => undefined);
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setErrors(err.fieldErrors);
        setError("Please check the highlighted fields.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-gold-dark" />
        <h1 className="mt-4 font-display text-[36px] font-medium text-white">Application received</h1>
        <p className="mt-3 text-[16px] text-ink-soft">
          Thank you. We&apos;ll review the application for <b className="text-ink">{form.business_name}</b> and email{" "}
          {form.email} once it&apos;s approved, usually within one working day. You can then log in and start ordering.
        </p>
        <ButtonLink href="/account" variant="secondary" className="mt-8">
          View your application
        </ButtonLink>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <p className="text-gold-dark text-[12px] uppercase tracking-[0.3em]">Trade account</p>
      <h1 className="mt-2 font-display text-[38px] sm:text-[46px] leading-tight font-medium text-white">
        Apply to order on account
      </h1>
      <p className="mt-3 text-[15px] text-ink-soft max-w-2xl">
        For restaurants, bars and hotels. Once approved you can order any wine on our list and pay each invoice within
        30 days. Already have an account?{" "}
        <Link href="/login" className="text-gold underline">
          Log in
        </Link>
        .
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <Section title="Your business">
          <Field label="Registered business name" required autoComplete="organization" {...bind("business_name")} />
          <Field label="Restaurant name (if different)" {...bind("trading_name")} />
          <Field label="Company number" hint="Companies House, if you have one" {...bind("company_number")} />
          <Field label="VAT number" {...bind("vat_number")} />
        </Section>

        <Section title="Contact & login" note="You'll use this email and password to log in and place orders.">
          <Field label="Your name" required autoComplete="name" {...bind("contact_name")} />
          <Field label="Phone" required type="tel" autoComplete="tel" {...bind("phone")} />
          <Field label="Email" required type="email" autoComplete="email" {...bind("email")} />
          <Field
            label="Password"
            required
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters"
            {...bind("password")}
          />
          <Field
            className="sm:col-span-2"
            label="Accounts email for invoices (optional)"
            type="email"
            hint="If invoices should go to your bookkeeper or accounts team instead"
            {...bind("accounts_email")}
          />
        </Section>

        <Section title="Billing address">
          <Field className="sm:col-span-2" label="Address line 1" required autoComplete="address-line1" {...bind("billing_line1")} />
          <Field className="sm:col-span-2" label="Address line 2" autoComplete="address-line2" {...bind("billing_line2")} />
          <Field label="Town / city" required autoComplete="address-level2" {...bind("billing_city")} />
          <Field label="Postcode" required autoComplete="postal-code" {...bind("billing_postcode")} />
        </Section>

        <Section title="Delivery">
          <label className="sm:col-span-2 flex items-center gap-3 text-[14px]">
            <input
              type="checkbox"
              checked={sameDelivery}
              onChange={(e) => setSameDelivery(e.target.checked)}
              className="h-5 w-5 accent-[#C4AD93]"
            />
            Deliver to the billing address
          </label>
          {!sameDelivery && (
            <>
              <Field className="sm:col-span-2" label="Delivery address line 1" required {...bind("delivery_line1")} />
              <Field className="sm:col-span-2" label="Delivery address line 2" {...bind("delivery_line2")} />
              <Field label="Town / city" required {...bind("delivery_city")} />
              <Field label="Postcode" required {...bind("delivery_postcode")} />
            </>
          )}
          <TextArea
            className="sm:col-span-2"
            label="Delivery notes (optional)"
            rows={3}
            placeholder="e.g. Deliveries before 11am via the rear entrance"
            {...bind("delivery_instructions")}
          />
        </Section>

        <label className="flex items-start gap-3 rounded-2xl bg-surface p-5 shadow-card ring-1 ring-white/10 text-[14px]">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#C4AD93]"
          />
          <span>
            I confirm this business holds the licences needed to sell alcohol, and I accept that each order is invoiced
            with payment due within 30 days.
          </span>
        </label>

        <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
          Submit application
        </Button>
      </form>
    </main>
  );
}
