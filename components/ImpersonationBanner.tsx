"use client";

import { Eye, X } from "lucide-react";
import { useEffect, useState } from "react";
import { IMPERSONATION_EVENT, Impersonation, endImpersonation, getImpersonation } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function remaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Ends the view and leaves the tab on a page saying so. A full page load, so
 * nothing from the client's session lingers in memory. */
function leave() {
  endImpersonation();
  window.location.replace("/impersonate?ended=1");
}

/**
 * Pinned to the bottom of every page while an admin is viewing the site as a
 * client, so it's never mistaken for a real session. Ends the view when the
 * token runs out.
 */
export default function ImpersonationBanner() {
  const { account } = useAuth();
  const [session, setSession] = useState<Impersonation | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const sync = () => setSession(getImpersonation());
    sync();
    window.addEventListener(IMPERSONATION_EVENT, sync);
    return () => window.removeEventListener(IMPERSONATION_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= session.expiresAt) leave();
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  if (!session) return null;
  const name = account?.business_name || session.name;

  return (
    <>
      {/* Keeps the footer clear of the bar. */}
      <div aria-hidden className="h-14" />
      <div
        role="status"
        className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t border-[#E32D23] bg-[#8D1B22] px-4 py-2.5 text-white shadow-[0_-4px_16px_rgba(0,0,0,0.4)]"
      >
        <Eye className="h-5 w-5 shrink-0" />
        <p className="min-w-0 flex-1 text-[13px] leading-snug">
          <b className="font-semibold">Viewing as {name}</b>
          <span className="opacity-90"> · view only, nothing can be changed or ordered · ends in {remaining(session.expiresAt - now)}</span>
        </p>
        <button
          type="button"
          onClick={leave}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/60 px-3 py-1.5 text-[13px] font-medium hover:bg-white/10"
        >
          <X className="h-4 w-4" />
          Exit
        </button>
      </div>
    </>
  );
}
