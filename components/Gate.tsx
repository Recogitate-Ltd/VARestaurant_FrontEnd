"use client";

import { Clock, ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Button, ButtonLink, PageSpinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { SUPPORT_EMAIL, SUPPORT_PHONE, formatDate } from "@/lib/format";

function Message({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-gold-light text-gold">{icon}</div>
      <h1 className="font-display text-[32px] leading-tight font-medium text-white">{title}</h1>
      <div className="mt-3 text-[15px] text-ink-soft space-y-3">{children}</div>
    </div>
  );
}

/**
 * Wraps pages that need an approved trade account. Signed-out visitors go to
 * the login page; pending, rejected and suspended accounts see why they
 * can't order yet.
 */
export default function Gate({ children }: { children: React.ReactNode }) {
  const { state, account, noTradeAccount, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (state === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname || "/wines")}`);
  }, [state, router, pathname]);

  if (state !== "signed-in") return <PageSpinner />;

  if (noTradeAccount || !account) {
    return (
      <Message icon={<ShieldAlert className="h-6 w-6" />} title="No trade account on this login">
        <p>
          This email is registered with Vintage Associates but doesn&apos;t have a restaurant trade account. Apply
          with your business details, or contact us at{" "}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </Message>
    );
  }

  if (account.status === "pending") {
    return (
      <Message icon={<Clock className="h-6 w-6" />} title="Your application is being reviewed">
        <p>
          Thanks for applying, {account.contact_name.split(" ")[0]}. We received the application for{" "}
          <b className="text-ink">{account.business_name}</b> on {formatDate(account.created_at)} and will email{" "}
          {account.email} as soon as it&apos;s approved, usually within one working day.
        </p>
        <p>
          Questions? Call {SUPPORT_PHONE} or email{" "}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <div className="pt-2">
          <ButtonLink href="/account" variant="secondary">
            Check your details
          </ButtonLink>
        </div>
      </Message>
    );
  }

  if (account.status !== "approved") {
    return (
      <Message icon={<ShieldAlert className="h-6 w-6" />} title="Ordering is unavailable">
        <p>
          {account.status === "suspended"
            ? "Ordering has been paused on this account."
            : "We weren't able to open a trade account for this business."}{" "}
          Please contact us on {SUPPORT_PHONE} or{" "}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </Message>
    );
  }

  return <>{children}</>;
}
