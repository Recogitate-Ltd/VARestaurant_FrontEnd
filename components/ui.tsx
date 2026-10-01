"use client";

import clsx from "clsx";
import Link from "next/link";
import React from "react";

/** The gold "VA" mark used in the investment app's header. */
export function Logo({ className, size = 35 }: { className?: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/va-logo-gold.svg"
      alt="Vintage Associates"
      height={size}
      width={Math.round((size * 140.8) / 114.4)}
      className={clsx("block select-none", className)}
      style={{ height: size, width: "auto" }}
    />
  );
}

/** The full gold "VA Vintage Associates" logo used in the app's footer. */
export function FullLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/va-full-logo-gold.svg"
      alt="Vintage Associates"
      width={144}
      height={48}
      className={clsx("block select-none", className)}
      style={{ width: 144, height: "auto" }}
    />
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "danger";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  // Mirrors the app's button.tsx: gold "filled", gold-outline "default".
  primary: "bg-gold text-black hover:bg-gold-dim disabled:opacity-50",
  secondary: "bg-transparent text-gold border border-gold hover:bg-gold/10",
  ghost: "text-gold hover:bg-raised",
  gold: "bg-gold text-black hover:bg-gold-dim",
  danger: "bg-[#8D1B22] text-white hover:opacity-90",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-normal tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:cursor-not-allowed",
        size === "sm" && "h-9 px-4 text-[13px]",
        size === "md" && "h-11 px-5 text-[14px]",
        size === "lg" && "h-12 px-7 text-[15px]",
        BUTTON_STYLES[variant],
        className
      )}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-normal tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        size === "sm" && "h-9 px-4 text-[13px]",
        size === "md" && "h-11 px-5 text-[14px]",
        size === "lg" && "h-12 px-7 text-[15px]",
        BUTTON_STYLES[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-faint">
      <Spinner className="h-7 w-7 text-gold" />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = props.id || props.name;
  return (
    <label htmlFor={id} className={clsx("block", className)}>
      <span className="block text-[12px] uppercase tracking-[0.12em] text-ink-soft mb-1.5">
        {label}
        {props.required && <span className="text-gold"> *</span>}
      </span>
      <input
        id={id}
        {...props}
        className={clsx(
          "w-full h-11 rounded-xl border bg-black/20 px-3.5 text-[15px] text-white placeholder:text-ink-faint outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20",
          error ? "border-danger" : "border-white/15"
        )}
      />
      {error ? (
        <span className="block mt-1 text-[12px] text-danger">{error}</span>
      ) : hint ? (
        <span className="block mt-1 text-[12px] text-ink-faint">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextArea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = props.id || props.name;
  return (
    <label htmlFor={id} className={clsx("block", className)}>
      <span className="block text-[12px] uppercase tracking-[0.12em] text-ink-soft mb-1.5">{label}</span>
      <textarea
        id={id}
        {...props}
        className="w-full rounded-xl border border-white/15 bg-black/20 px-3.5 py-2.5 text-[15px] text-white placeholder:text-ink-faint outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
      />
    </label>
  );
}

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "error" | "success" | "warning";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-xl border px-4 py-3 text-[14px]",
        tone === "info" && "border-gold/30 bg-gold/10 text-ink",
        tone === "error" && "border-danger/40 bg-danger/10 text-[#F2B8B8]",
        tone === "success" && "border-ok/40 bg-ok/10 text-[#A8EBCB]",
        tone === "warning" && "border-gold/40 bg-gold/10 text-gold-dark",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-normal uppercase tracking-[0.12em]",
        className
      )}
    >
      {children}
    </span>
  );
}

export function PaymentBadge({ status, label }: { status: string; label: string }) {
  const tone =
    status === "paid"
      ? "bg-ok/10 text-ok ring-1 ring-ok/40"
      : status === "overdue"
        ? "bg-danger/10 text-danger ring-1 ring-danger/40"
        : status === "void"
          ? "bg-white/5 text-ink-faint ring-1 ring-white/15"
          : "bg-gold/10 text-gold ring-1 ring-gold/40";
  return <Badge className={tone}>{label}</Badge>;
}
