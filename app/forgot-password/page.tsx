"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Alert, Button, Field } from "@/components/ui";
import { ApiError, api } from "@/lib/api";

/** Two steps, using the existing account reset: email a 6-digit code, then set a new password. */
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/auth/password/reset/", { method: "POST", body: { email: email.trim() }, auth: false });
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/auth/password/reset/confirm/", {
        method: "POST",
        body: { email: email.trim(), token: token.trim(), new_password: password },
        auth: false,
      });
      setStep("done");
    } catch (err) {
      setError(
        err instanceof ApiError ? Object.values(err.fieldErrors)[0] || err.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 sm:px-6 py-14 sm:py-20">
      <div className="rounded-3xl bg-surface p-6 sm:p-8 shadow-card ring-1 ring-white/10">
        <h1 className="font-display text-[34px] font-medium text-white">Reset password</h1>
        {step === "email" && (
          <form onSubmit={requestCode} className="mt-6 space-y-4">
            <p className="text-[14px] text-ink-soft">We&apos;ll email you a 6-digit code.</p>
            {error && <Alert tone="error">{error}</Alert>}
            <Field label="Email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" size="lg" className="w-full" loading={busy}>
              Send code
            </Button>
          </form>
        )}
        {step === "code" && (
          <form onSubmit={reset} className="mt-6 space-y-4">
            <Alert tone="info">We&apos;ve emailed a code to {email}.</Alert>
            {error && <Alert tone="error">{error}</Alert>}
            <Field
              label="6-digit code"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Field
              label="New password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" size="lg" className="w-full" loading={busy}>
              Set new password
            </Button>
          </form>
        )}
        {step === "done" && (
          <div className="mt-6 space-y-4">
            <Alert tone="success">Your password has been changed.</Alert>
            <Link href="/login" className="text-gold underline">
              Log in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
