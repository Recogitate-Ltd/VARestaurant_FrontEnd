/** Minimal fetch wrapper for the Vintage Associates API. */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "va_trade_token";

/**
 * "View as client": an admin opens this site from the admin panel signed in
 * as a restaurant, to see their exact screens. The admin panel hands over a
 * short-lived, view-only token (the backend refuses anything but reads). It
 * lives in sessionStorage, so it stays in that one tab and never replaces a
 * real sign-in kept in localStorage.
 */
const IMPERSONATION_KEY = "va_trade_impersonation";
export const IMPERSONATION_EVENT = "va-trade-impersonation";

export interface Impersonation {
  token: string;
  /** Who the admin is viewing as, for the banner. */
  name: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

export function getImpersonation(): Impersonation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(IMPERSONATION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Impersonation;
    if (!value?.token || !(value.expiresAt > Date.now())) {
      window.sessionStorage.removeItem(IMPERSONATION_KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

/** Reads the expiry (``exp``, seconds) out of a JWT without verifying it. */
export function tokenExpiry(token: string): number | null {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const exp = JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), "="))).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function startImpersonation(token: string, name: string): boolean {
  const expiresAt = tokenExpiry(token);
  if (!expiresAt || expiresAt <= Date.now()) return false;
  try {
    window.sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify({ token, name, expiresAt }));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(IMPERSONATION_EVENT));
  return true;
}

export function endImpersonation() {
  try {
    window.sessionStorage.removeItem(IMPERSONATION_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(IMPERSONATION_EVENT));
}

/** The Authorization header for the current session, if any. */
function authHeader(): string | null {
  const impersonation = getImpersonation();
  if (impersonation) return `Bearer ${impersonation.token}`;
  const token = getToken();
  return token ? `Token ${token}` : null;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const impersonation = getImpersonation();
  if (impersonation) return impersonation.token;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  // Signing out while viewing as a client ends the view, and leaves any real
  // sign-in on this browser alone.
  if (!token && getImpersonation()) {
    endImpersonation();
    return;
  }
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private mode etc.: the session just won't survive a reload.
  }
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown, message: string) {
    super(message);
    this.status = status;
    this.data = data;
  }

  /** Field errors from a DRF 400 response, flattened to one message per field. */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    if (this.data && typeof this.data === "object") {
      for (const [key, value] of Object.entries(this.data as Record<string, unknown>)) {
        if (Array.isArray(value)) out[key] = value.map(String).join(" ");
        else if (typeof value === "string") out[key] = value;
      }
    }
    return out;
  }
}

function messageFrom(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    if (Array.isArray(d.detail)) return d.detail.map(String).join(" ");
    const first = Object.values(d)[0];
    if (Array.isArray(first) && first.length) return first.map(String).join(" ");
    if (typeof first === "string") return first;
  }
  return fallback;
}

type Query = Record<string, string | number | boolean | undefined | null | (string | number)[]>;

export function buildQuery(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Download a file (e.g. a PDF invoice) from an authenticated endpoint. With a
 * ``body``, it is POSTed as JSON (e.g. a proposal to draw as a PDF). */
export async function downloadFile(path: string, filename: string, body?: unknown): Promise<void> {
  const authorization = authHeader();
  const headers: Record<string, string> = authorization ? { Authorization: authorization } : {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: body !== undefined ? "POST" : "GET",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, null, "We couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      // not JSON
    }
    throw new ApiError(response.status, data, messageFrom(data, `Download failed (${response.status}).`));
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Query; auth?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const authorization = auth ? authHeader() : null;
  const token = authorization ? getToken() : null;
  if (authorization) headers.Authorization = authorization;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, null, "We couldn't reach the server. Check your connection and try again.");
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    if (response.status === 401 && token) {
      setToken(null);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("va-trade-logout"));
    }
    throw new ApiError(response.status, data, messageFrom(data, `Something went wrong (${response.status}).`));
  }
  return data as T;
}
