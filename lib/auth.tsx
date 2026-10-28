"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, api, getToken, setToken } from "./api";
import type { ProposalAccess, TradeAccount } from "./types";

type AuthState = "loading" | "anonymous" | "signed-in";

interface AuthContextValue {
  state: AuthState;
  account: TradeAccount | null;
  /** True when the login has no trade account (e.g. an investment member). */
  noTradeAccount: boolean;
  /** The team's proposals login (support@…): can price wines and send proposals. */
  proposals: ProposalAccess | null;
  /** Signs in; resolves to the trade account (null when the login has none) and whether it can make proposals. */
  login: (email: string, password: string) => Promise<{ account: TradeAccount | null; proposals: boolean }>;
  logout: () => void;
  refresh: () => Promise<void>;
  setAccount: (account: TradeAccount) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [account, setAccount] = useState<TradeAccount | null>(null);
  const [noTradeAccount, setNoTradeAccount] = useState(false);
  const [proposals, setProposals] = useState<ProposalAccess | null>(null);

  const loadProposals = useCallback(async () => {
    try {
      const access = await api<ProposalAccess>("/api/trade/proposals/access/");
      const value = access.allowed ? access : null;
      setProposals(value);
      return value;
    } catch {
      setProposals(null);
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setAccount(null);
      setProposals(null);
      setState("anonymous");
      return;
    }
    // Alongside the account, and settled before we say "signed-in", so a proposals login
    // with no trade account never flashes "No trade account".
    const proposalsLoaded = loadProposals();
    try {
      const acc = await api<TradeAccount>("/api/trade/account/");
      await proposalsLoaded;
      setAccount(acc);
      setNoTradeAccount(false);
      setState("signed-in");
    } catch (err) {
      await proposalsLoaded;
      if (err instanceof ApiError && err.status === 404) {
        setAccount(null);
        setNoTradeAccount(true);
        setState("signed-in");
      } else if (err instanceof ApiError && err.status === 401) {
        setToken(null);
        setAccount(null);
        setState("anonymous");
      } else {
        // Network blip: keep the token and let pages retry.
        setState(getToken() ? "signed-in" : "anonymous");
      }
    }
  }, [loadProposals]);

  useEffect(() => {
    refresh();
    const onLogout = () => {
      setAccount(null);
      setProposals(null);
      setState("anonymous");
    };
    window.addEventListener("va-trade-logout", onLogout);
    return () => window.removeEventListener("va-trade-logout", onLogout);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ key: string }>("/auth/sign-in/", {
      method: "POST",
      body: { email: email.trim(), password },
      auth: false,
    });
    setToken(res.key);
    const proposalsLoaded = loadProposals();
    try {
      const acc = await api<TradeAccount>("/api/trade/account/");
      const access = await proposalsLoaded;
      setAccount(acc);
      setNoTradeAccount(false);
      setState("signed-in");
      return { account: acc, proposals: !!access };
    } catch (err) {
      const access = await proposalsLoaded;
      if (err instanceof ApiError && err.status === 404) {
        setNoTradeAccount(true);
        setAccount(null);
        setState("signed-in");
        return { account: null, proposals: !!access };
      }
      throw err;
    }
  }, [loadProposals]);

  const logout = useCallback(() => {
    const token = getToken();
    if (token) {
      api("/auth/logout/", { method: "POST" }).catch(() => undefined);
    }
    setToken(null);
    setAccount(null);
    setNoTradeAccount(false);
    setProposals(null);
    setState("anonymous");
  }, []);

  const value = useMemo(
    () => ({ state, account, noTradeAccount, proposals, login, logout, refresh, setAccount }),
    [state, account, noTradeAccount, proposals, login, logout, refresh]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
