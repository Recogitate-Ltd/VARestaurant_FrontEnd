"use client";

import clsx from "clsx";
import { CheckCircle2, FileText, PoundSterling, ShieldCheck } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import SignaturePad from "@/components/SignaturePad";
import { Alert, Button, ButtonLink, Field, Spinner, TextArea } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Declaration, TradeTerms, fetchTradeTerms, sectionsFor } from "@/lib/trade-terms";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar / wine bar" },
  { value: "hotel", label: "Hotel" },
  { value: "pub", label: "Pub" },
  { value: "retail", label: "Retail / off-licence" },
  { value: "other", label: "Other" },
];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMPTY = {
  trading_name: "",
  business_name: "", // registered company name
  business_type: "restaurant",
  company_number: "",
  vat_number: "",
  website: "",
  billing_line1: "",
  billing_line2: "",
  billing_city: "",
  billing_postcode: "",
  premises_licence_number: "",
  delivery_line1: "",
  delivery_line2: "",
  delivery_city: "",
  delivery_postcode: "",
  delivery_instructions: "",
  contact_name: "",
  contact_position: "",
  email: "",
  phone: "",
  accounts_email: "",
  estimated_monthly_spend: "",
  password: "",
  signatory_name: "",
  signatory_position: "",
  signed_on: "",
};

type Form = typeof EMPTY;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: Form, sameDelivery: boolean, checks: Checks, signature: string) {
  const e: Record<string, string> = {};
  const need = (key: keyof Form, message: string) => {
    if (!form[key].trim()) e[key] = message;
  };
  need("trading_name", "Trading name is required");
  need("billing_line1", "Address is required");
  need("billing_city", "Town or city is required");
  need("billing_postcode", "Postcode is required");
  need("premises_licence_number", "Premises licence number is required");
  if (!sameDelivery) {
    need("delivery_line1", "Delivery address is required");
    need("delivery_city", "Town or city is required");
    need("delivery_postcode", "Postcode is required");
  }
  need("contact_name", "Contact name is required");
  if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email address";
  need("phone", "Phone number is required");
  if (!EMAIL_RE.test(form.accounts_email.trim())) e.accounts_email = "Enter a valid email address";
  need("estimated_monthly_spend", "Estimated monthly spend is required");
  if (form.password.length < 8) e.password = "Choose a password of at least 8 characters";
  if (!checks.accept_terms) e.accept_terms = "Please accept the trading terms to continue";
  need("signatory_name", "Signatory name is required");
  need("signatory_position", "Position is required");
  if (!checks.confirm_director) e.confirm_director = "This application must be signed by a director of the business";
  if (!checks.consent_electronic_signature)
    e.consent_electronic_signature = "Please confirm you're happy for an electronic signature to be used";
  if (!signature) e.signature = "Please add the director's signature";
  need("signed_on", "Date is required");
  return e;
}

const NO_CHECKS: Record<Declaration, boolean> = {
  accept_terms: false,
  confirm_director: false,
  consent_electronic_signature: false,
};
type Checks = typeof NO_CHECKS;

/** A numbered section: title on the left, fields on the right (stacked on mobile). */
function Section({
  number,
  title,
  note,
  children,
}: {
  number: number;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-5 border-t border-line pt-8 md:grid-cols-[200px_1fr] md:gap-10">
      <legend className="sr-only">{title}</legend>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">Section {number}</p>
        <h2 className="mt-1.5 font-display text-[24px] font-medium text-white">{title}</h2>
        {note && <p className="mt-1 text-[13px] text-ink-soft">{note}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Check({
  checked,
  onChange,
  error,
  className,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="flex items-start gap-3 text-[14px] text-ink">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#C4AD93]"
        />
        <span>{children}</span>
      </label>
      {error && <span className="mt-1 block pl-8 text-[12px] text-danger">{error}</span>}
    </div>
  );
}

export default function ApplyPage() {
  const { login } = useAuth();
  const [form, setForm] = useState<Form>(() => ({ ...EMPTY, signed_on: today() }));
  const [sameDelivery, setSameDelivery] = useState(true);
  const [checks, setChecks] = useState<Checks>(NO_CHECKS);
  const [signature, setSignature] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [terms, setTerms] = useState<TradeTerms | null>(null);
  const [termsError, setTermsError] = useState("");
  const [paymentOption, setPaymentOption] = useState("");

  const loadTerms = useCallback(() => {
    setTermsError("");
    fetchTradeTerms()
      .then((t) => {
        setTerms(t);
        setPaymentOption((current) => current || t.default_payment_option);
      })
      .catch(() => setTermsError("We couldn't load our terms and conditions. Please try again."));
  }, []);

  useEffect(loadTerms, [loadTerms]);

  const payment = terms?.payment_options.find((o) => o.value === paymentOption) ?? terms?.payment_options[0];

  const clearError = useCallback(
    (name: string) =>
      setErrors((current) => {
        if (!(name in current)) return current;
        const rest = { ...current };
        delete rest[name];
        return rest;
      }),
    []
  );

  const onSignature = useCallback(
    (dataUrl: string) => {
      setSignature(dataUrl);
      if (dataUrl) clearError("signature");
    },
    [clearError]
  );

  const bind = (name: keyof Form) => ({
    name,
    value: form[name],
    error: errors[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [name]: e.target.value }));
      clearError(name);
    },
  });

  const check = (name: keyof Checks) => ({
    checked: checks[name],
    error: errors[name],
    onChange: (value: boolean) => {
      setChecks((c) => ({ ...c, [name]: value }));
      clearError(name);
    },
  });

  const showErrors = (found: Record<string, string>) => {
    setErrors(found);
    setError("Please check the highlighted fields");
    requestAnimationFrame(() =>
      document.querySelector("main .text-danger")?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!terms || !payment) {
      setError("Please wait for the terms and conditions to load, then try again.");
      return;
    }
    const found = validate(form, sameDelivery, checks, signature);
    setErrors(found);
    if (Object.keys(found).length) {
      showErrors(found);
      return;
    }
    setSubmitting(true);
    const body: Record<string, unknown> = {
      ...form,
      ...checks,
      payment_option: payment.value,
      signature,
      // The registered name is the account's name; the trading name stands in when it's the same.
      business_name: form.business_name.trim() || form.trading_name.trim(),
    };
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
        showErrors(err.fieldErrors);
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
          Thank you. We&apos;ll review the application for{" "}
          <b className="text-ink">{form.trading_name || form.business_name}</b> and email {form.email} within two
          working days. Once it&apos;s approved you can log in and start ordering. We&apos;ve emailed you a copy of
          your signed application.
        </p>
        <ButtonLink href="/account" variant="secondary" className="mt-8">
          View your application
        </ButtonLink>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="font-display text-[38px] sm:text-[46px] leading-tight font-medium text-white">
        Trade account application
      </h1>
      <p className="mt-3 text-[15px] text-ink-soft max-w-2xl">
        Complete the form below to open a wine account with Vintage Associates. It takes around five minutes —
        you&apos;ll need your company details and premises licence number to hand. Already have an account?{" "}
        <Link href="/login" className="text-gold underline">
          Log in
        </Link>
        .
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { Icon: FileText, title: "Payment terms", text: "14 or 30 days, or end of the following month" },
          { Icon: PoundSterling, title: "Minimum order", text: "£450 ex VAT" },
          { Icon: ShieldCheck, title: "Credit account", text: "Subject to approval and credit limit" },
        ].map(({ Icon, title, text }) => (
          <div key={title} className="flex gap-3 rounded-xl bg-surface p-4 shadow-card ring-1 ring-white/10">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <div>
              <p className="text-[14px] text-white">{title}</p>
              <p className="text-[13px] text-ink-soft">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-10 space-y-10" noValidate>
        <Section number={1} title="Your business" note="As it appears on your invoices and company records.">
          <Field className="sm:col-span-2" label="Trading name" required {...bind("trading_name")} />
          <Field
            label="Registered company name"
            optional
            autoComplete="organization"
            hint="If different from your trading name."
            {...bind("business_name")}
          />
          <label htmlFor="business_type" className="block">
            <span className="block text-[12px] uppercase tracking-[0.12em] text-ink-soft mb-1.5">
              Type of business
            </span>
            <select
              id="business_type"
              {...bind("business_type")}
              className="w-full h-11 rounded-xl border border-white/15 bg-black/20 px-3 text-[15px] text-white outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-surface">
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <Field label="Company number" optional {...bind("company_number")} />
          <Field label="VAT number" optional {...bind("vat_number")} />
          <Field className="sm:col-span-2" label="Website" optional placeholder="https://" {...bind("website")} />
        </Section>

        <Section number={2} title="Trading address">
          <Field
            className="sm:col-span-2"
            label="Address line 1"
            required
            autoComplete="address-line1"
            {...bind("billing_line1")}
          />
          <Field
            className="sm:col-span-2"
            label="Address line 2"
            optional
            autoComplete="address-line2"
            {...bind("billing_line2")}
          />
          <Field label="Town or city" required autoComplete="address-level2" {...bind("billing_city")} />
          <Field label="Postcode" required autoComplete="postal-code" {...bind("billing_postcode")} />
        </Section>

        <Section number={3} title="Deliveries & licence" note="We can only supply alcohol to licensed premises.">
          <Field
            className="sm:col-span-2"
            label="Premises licence number"
            required
            {...bind("premises_licence_number")}
          />
          <Check
            className="sm:col-span-2 rounded-xl bg-surface p-4 ring-1 ring-white/10"
            checked={sameDelivery}
            onChange={setSameDelivery}
          >
            Deliveries go to the trading address above
          </Check>
          {!sameDelivery && (
            <>
              <Field className="sm:col-span-2" label="Delivery address" required {...bind("delivery_line1")} />
              <Field className="sm:col-span-2" label="Address line 2" optional {...bind("delivery_line2")} />
              <Field label="Town or city" required {...bind("delivery_city")} />
              <Field label="Postcode" required {...bind("delivery_postcode")} />
            </>
          )}
          <TextArea
            className="sm:col-span-2"
            label="Delivery instructions"
            optional
            rows={3}
            hint="Access, delivery window, who signs for stock."
            {...bind("delivery_instructions")}
          />
        </Section>

        <Section number={4} title="Contacts">
          <Field label="Main contact" required autoComplete="name" {...bind("contact_name")} />
          <Field
            label="Position"
            optional
            placeholder="e.g. Head Sommelier"
            autoComplete="organization-title"
            {...bind("contact_position")}
          />
          <Field label="Email" required type="email" autoComplete="email" {...bind("email")} />
          <Field label="Phone" required type="tel" autoComplete="tel" {...bind("phone")} />
          <Field
            label="Invoices email"
            required
            type="email"
            hint="Where we send statements and invoices."
            {...bind("accounts_email")}
          />
          <Field
            label="Estimated monthly spend"
            required
            placeholder="e.g. £2,000"
            {...bind("estimated_monthly_spend")}
          />
          <Field
            className="sm:col-span-2"
            label="Create a password"
            required
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters. You'll log in with your email and this password to place orders."
            {...bind("password")}
          />
        </Section>

        <Section
          number={5}
          title="Terms & signature"
          note="Read and accept our terms and conditions of sale. This application must be signed by a director of the business."
        >
          <div className="sm:col-span-2 space-y-2 rounded-xl bg-surface p-5 text-[13px] text-ink-soft ring-1 ring-white/10">
            <p>
              <b className="font-medium text-white">Payment terms:</b> choose the terms you&apos;d like below. Each
              invoice shows its due date, and we email a statement of your invoices at the end of each month.
            </p>
            <p>
              <b className="font-medium text-white">Licensing:</b> we supply licensed premises only; the licence number
              above must be valid at the point of delivery.
            </p>
            <p>
              <b className="font-medium text-white">Credit:</b> the account and payment terms are subject to approval,
              and a credit limit will be confirmed in writing before your first order.
            </p>
            <p>
              <b className="font-medium text-white">Signature:</b> the declaration below must be signed by a director
              of the business.
            </p>
          </div>

          {termsError ? (
            <div className="sm:col-span-2">
              <Alert tone="error">
                {termsError}{" "}
                <button type="button" onClick={loadTerms} className="underline">
                  Try again
                </button>
              </Alert>
            </div>
          ) : !terms || !payment ? (
            <div className="sm:col-span-2 flex items-center gap-3 py-6 text-[13px] text-ink-faint">
              <Spinner className="h-5 w-5 text-gold" /> Loading our terms and conditions…
            </div>
          ) : (
            <>
              <fieldset className="sm:col-span-2">
                <legend className="block text-[12px] uppercase tracking-[0.12em] text-ink-soft mb-1.5">
                  Payment terms<span className="text-gold"> *</span>
                </legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {terms.payment_options.map((option) => (
                    <label
                      key={option.value}
                      className={clsx(
                        "flex cursor-pointer items-start gap-3 rounded-xl p-3.5 text-[14px] ring-1 transition",
                        option.value === payment.value
                          ? "bg-gold/10 text-white ring-gold"
                          : "bg-surface text-ink ring-white/10 hover:ring-white/25"
                      )}
                    >
                      <input
                        type="radio"
                        name="payment_option"
                        value={option.value}
                        checked={option.value === payment.value}
                        onChange={() => setPaymentOption(option.value)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#C4AD93]"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                <span className="mt-1 block text-[12px] text-ink-faint">
                  Subject to approval. Clause 3.2 of the terms below changes to match.
                </span>
              </fieldset>

              <div className="sm:col-span-2">
                <div
                  tabIndex={0}
                  aria-label="Terms and conditions of sale"
                  className="max-h-72 overflow-y-auto rounded-xl bg-black/20 p-5 text-[13px] leading-relaxed text-ink-soft ring-1 ring-white/10 focus:outline-none focus:ring-gold"
                >
                  <h3 className="text-[14px] font-medium text-white">Terms &amp; conditions of sale</h3>
                  <p className="mt-1 text-[12px]">{terms.intro}</p>
                  {sectionsFor(terms, payment).map((section, i) => (
                    <div key={section.title} className="mt-4">
                      <h4 className="text-[12px] font-medium tracking-wide text-white">
                        {i + 1}. {section.title}
                      </h4>
                      <ol className="mt-1.5 space-y-1.5">
                        {section.clauses.map((clause, j) => (
                          <li key={j} className="flex gap-3">
                            <span className="w-6 shrink-0 text-ink-faint">
                              {i + 1}.{j + 1}
                            </span>
                            <span>{clause}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
                <span className="mt-1 block text-[12px] text-ink-faint">Scroll to read all clauses.</span>
              </div>

              <Check className="sm:col-span-2" {...check("accept_terms")}>
                {payment.declarations.accept_terms}
              </Check>
            </>
          )}

          <Field label="Full name" required {...bind("signatory_name")} />
          <Field
            label="Position"
            required
            hint="Director, or equivalent officer of the business."
            {...bind("signatory_position")}
          />

          {payment && (
            <>
              <Check className="sm:col-span-2" {...check("confirm_director")}>
                {payment.declarations.confirm_director}
              </Check>
              <Check className="sm:col-span-2" {...check("consent_electronic_signature")}>
                {payment.declarations.consent_electronic_signature}
              </Check>
            </>
          )}

          <div className="sm:col-span-2">
            <SignaturePad label="Director's signature" onChange={onSignature} error={errors.signature} />
          </div>

          <Field label="Date" required type="date" {...bind("signed_on")} />
        </Section>

        <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
            Submit application
          </Button>
          <p className="text-[13px] text-ink-soft">We&apos;ll reply within two working days.</p>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
      </form>
    </main>
  );
}
