"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, api, getToken, setToken } from "./api";
import type { TradeAccount } from "./types";

type AuthState = "loading" | "anonymous" | "signed-in";

interface AuthContextValue {
  state: AuthState;
  account: TradeAccount | null;
  /** True when the login has no trade account (e.g. an investment member). */
  noTradeAccount: boolean;
  login: (email: string, password: string) => Promise<TradeAccount | null>;
  logout: () => void;
  refresh: () => Promise<void>;
  setAccount: (account: TradeAccount) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [account, setAccount] = useState<TradeAccount | null>(null);
  const [noTradeAccount, setNoTradeAccount] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setAccount(null);
      setState("anonymous");
      return;
    }
    try {
      const acc = await api<TradeAccount>("/api/trade/account/");
      setAccount(acc);
      setNoTradeAccount(false);
      setState("signed-in");
    } catch (err) {
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
  }, []);

  useEffect(() => {
    refresh();
    const onLogout = () => {
      setAccount(null);
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
    try {
      const acc = await api<TradeAccount>("/api/trade/account/");
      setAccount(acc);
      setNoTradeAccount(false);
      setState("signed-in");
      return acc;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNoTradeAccount(true);
        setAccount(null);
        setState("signed-in");
        return null;
      }
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    const token = getToken();
    if (token) {
      api("/auth/logout/", { method: "POST" }).catch(() => undefined);
    }
    setToken(null);
    setAccount(null);
    setNoTradeAccount(false);
    setState("anonymous");
  }, []);

  const value = useMemo(
    () => ({ state, account, noTradeAccount, login, logout, refresh, setAccount }),
    [state, account, noTradeAccount, login, logout, refresh]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
