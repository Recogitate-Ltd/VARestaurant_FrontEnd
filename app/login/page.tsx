"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { Alert, Button, Field } from "@/components/ui";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { login, state, account } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/wines";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/wines";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (state === "signed-in" && account) router.replace(account.status === "approved" ? safeNext : "/account");
  }, [state, account, router, safeNext]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const acc = await login(email, password);
      router.replace(acc?.status === "approved" ? safeNext : acc ? "/account" : "/wines");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't log you in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 sm:px-6 py-14 sm:py-20">
      <div className="rounded-3xl bg-surface p-6 sm:p-8 shadow-card ring-1 ring-white/10">
        <h1 className="font-display text-[36px] font-medium text-white">Log in</h1>
        <p className="mt-1 text-[14px] text-ink-soft">to order for your restaurant</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" size="lg" loading={submitting} className="w-full">
            Log in
          </Button>
        </form>
        <div className="mt-5 flex justify-between text-[13px]">
          <Link href="/forgot-password" className="text-gold hover:underline">
            Forgotten password?
          </Link>
          <Link href="/apply" className="text-gold hover:underline">
            Apply for an account
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
