"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/ui";
import { getImpersonation, startImpersonation } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { homePath } from "@/lib/format";

/**
 * "View as client" landing page. The admin panel opens
 * ``/impersonate#token=…&name=…`` in a new tab. The token is in the URL
 * fragment, so it is never sent to a server or kept in its logs, and it is
 * wiped from the address bar straight away.
 */
export default function ImpersonatePage() {
  const router = useRouter();
  const { state, account } = useAuth();
  const [phase, setPhase] = useState<"starting" | "started" | "ended" | "invalid">("starting");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (!token) {
      if (new URLSearchParams(window.location.search).get("ended")) setPhase("ended");
      // Already started (the fragment was consumed by an earlier run, e.g. a reload).
      else setPhase(getImpersonation() ? "started" : "invalid");
      return;
    }
    setPhase(startImpersonation(token, params.get("name") || "this client") ? "started" : "invalid");
  }, []);

  // Once the client's account has loaded, show them their usual first page.
  useEffect(() => {
    if (phase === "started" && state === "signed-in") router.replace(homePath(account));
  }, [phase, state, account, router]);

  if (phase === "starting" || phase === "started") return <PageSpinner label="Opening the client's view…" />;

  return (
    <main className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-gold-light text-gold">
        <Eye className="h-6 w-6" />
      </div>
      <h1 className="font-display text-[32px] leading-tight font-medium text-white">
        {phase === "ended" ? "Client view ended" : "This link has expired"}
      </h1>
      <p className="mt-3 text-[15px] text-ink-soft">
        {phase === "ended"
          ? "You're no longer viewing the site as the client. You can close this tab."
          : "Client view links only work once and for a short time. Open the restaurant in the admin panel and choose “View as client” again."}
      </p>
    </main>
  );
}
