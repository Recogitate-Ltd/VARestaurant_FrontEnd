"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Alert, Button, Field, PageSpinner, TextArea } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { TradeAccount } from "@/lib/types";

const STATUS_TEXT: Record<string, { label: string; tone: "success" | "warning" | "error" }> = {
  approved: { label: "Approved for ordering", tone: "success" },
  pending: { label: "Application under review", tone: "warning" },
  rejected: { label: "Application not approved", tone: "error" },
  suspended: { label: "Ordering paused", tone: "error" },
};

type Editable = Pick<
  TradeAccount,
  | "trading_name"
  | "contact_name"
  | "phone"
  | "accounts_email"
  | "vat_number"
  | "delivery_line1"
  | "delivery_line2"
  | "delivery_city"
  | "delivery_postcode"
  | "delivery_instructions"
>;

export default function AccountPage() {
  const { state, account, noTradeAccount, setAccount, logout } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<Editable | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state === "anonymous") router.replace("/login?next=/account");
  }, [state, router]);

  useEffect(() => {
    if (account) {
      setForm({
        trading_name: account.trading_name,
        contact_name: account.contact_name,
        phone: account.phone,
        accounts_email: account.accounts_email,
        vat_number: account.vat_number,
        delivery_line1: account.delivery_line1,
        delivery_line2: account.delivery_line2,
        delivery_city: account.delivery_city,
        delivery_postcode: account.delivery_postcode,
        delivery_instructions: account.delivery_instructions,
      });
    }
  }, [account]);

  if (state !== "signed-in" || (!account && !noTradeAccount)) return <PageSpinner />;
  if (!account || !form) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <Alert tone="warning">This login doesn&apos;t have a restaurant trade account.</Alert>
      </main>
    );
  }

  const status = STATUS_TEXT[account.status];
  const bind = (name: keyof Editable) => ({
    name,
    value: form[name] ?? "",
    error: errors[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => (f ? { ...f, [name]: e.target.value } : f)),
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrors({});
    try {
      const updated = await api<TradeAccount>("/api/trade/account/", { method: "PATCH", body: form });
      setAccount(updated);
      setMessage({ tone: "success", text: "Your details have been saved." });
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Couldn't save." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-[38px] sm:text-[44px] font-medium text-white">Your account</h1>
      <Alert tone={status.tone} className="mt-4">
        <b>{status.label}</b>
        {account.status === "approved" &&
          (account.kind === "member" ? (
            <> · orders are billed separately by our team</>
          ) : (
            <> · invoices payable within {account.payment_terms_days} days</>
          ))}
        {account.status === "pending" && <> · applied {formatDate(account.created_at)}</>}
      </Alert>

      <section className="mt-6 rounded-2xl bg-surface p-5 sm:p-6 shadow-card ring-1 ring-white/10 text-[14px] grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-ink-faint text-[12px]">{account.kind === "member" ? "Name" : "Business"}</p>
          <p className="font-medium">{account.business_name}</p>
          {account.company_number && <p className="text-ink-soft">Company no. {account.company_number}</p>}
        </div>
        <div>
          <p className="text-ink-faint text-[12px]">Login email</p>
          <p className="font-medium break-all">{account.email}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-ink-faint text-[12px]">Billing address</p>
          <p>
            {[account.billing_line1, account.billing_line2, account.billing_city, account.billing_postcode]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="mt-1 text-[12px] text-ink-faint">
            To change your {account.kind === "member" ? "name" : "business name"} or billing address, please contact us.
          </p>
        </div>
      </section>

      <form onSubmit={save} className="mt-6 rounded-2xl bg-surface p-5 sm:p-6 shadow-card ring-1 ring-white/10">
        <h2 className="font-display text-[24px] font-medium text-white">Contact &amp; delivery</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {account.kind !== "member" && (
            <>
              <Field label="Restaurant name" {...bind("trading_name")} />
              <Field label="VAT number" {...bind("vat_number")} />
            </>
          )}
          <Field label="Contact name" {...bind("contact_name")} />
          <Field label="Phone" type="tel" {...bind("phone")} />
          {account.kind !== "member" && (
            <Field className="sm:col-span-2" label="Accounts email for invoices" type="email" hint="Leave blank to use your login email" {...bind("accounts_email")} />
          )}
          <Field className="sm:col-span-2" label="Delivery address line 1" hint="Leave blank to deliver to the billing address" {...bind("delivery_line1")} />
          <Field className="sm:col-span-2" label="Delivery address line 2" {...bind("delivery_line2")} />
          <Field label="Town / city" {...bind("delivery_city")} />
          <Field label="Postcode" {...bind("delivery_postcode")} />
          <TextArea className="sm:col-span-2" label="Delivery notes" rows={3} {...bind("delivery_instructions")} />
        </div>
        {message && (
          <Alert tone={message.tone} className="mt-4">
            {message.text}
          </Alert>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
          <Button type="button" variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </form>
    </main>
  );
}
