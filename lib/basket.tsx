"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FORMAT_BOTTLES, lineVat, SOLD_FORMATS } from "./format";
import type { Accessory, FormatCode, Wine } from "./types";

/**
 * The basket lives in the browser. Each line keeps a copy of what was shown
 * (name, price, image) so the basket renders instantly; prices are always
 * re-checked by the server when the order is placed.
 *
 * Wine prices are ex VAT and accessory prices inc VAT, so the basket keeps a
 * subtotal (ex VAT), the VAT, and the total inc VAT.
 */
export interface BasketLine {
  product_code: string;
  format: FormatCode;
  quantity: number;
  name: string;
  producer: string;
  size: string;
  wine_type: string;
  image_url: string | null;
  unit_price: string;
  /** Accessory lines (format "accessory", product_code = SKU) keep their pack, e.g. "Set of 2". */
  pack?: string;
}

/** Where a basket line's product lives on the site. */
export function lineHref(line: Pick<BasketLine, "product_code" | "format">): string {
  const code = encodeURIComponent(line.product_code);
  return line.format === "accessory" ? `/accessories/${code}` : `/wines/${code}`;
}

interface BasketContextValue {
  lines: BasketLine[];
  ready: boolean;
  add: (wine: Wine, format: FormatCode, quantity: number) => void;
  addAccessory: (item: Accessory, quantity: number) => void;
  setQuantity: (productCode: string, format: FormatCode, quantity: number) => void;
  remove: (productCode: string, format: FormatCode) => void;
  clear: () => void;
  replacePrices: (prices: { product_code: string; format: FormatCode; unit_price: string }[]) => void;
  /** Before VAT. */
  subtotal: number;
  vat: number;
  /** Including VAT: what the restaurant pays. */
  total: number;
  bottles: number;
  /** Accessory units (glasses sets, decanters…) in the basket. */
  accessories: number;
  units: number;
  /** Bumps whenever something is added, so the header can animate. */
  addedAt: number;
}

const STORAGE_KEY = "va_trade_basket_v1";
const BasketContext = createContext<BasketContextValue | undefined>(undefined);

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<BasketLine[]>([]);
  const [ready, setReady] = useState(false);
  const [addedAt, setAddedAt] = useState(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Drop lines in formats we no longer sell (cases of 3 and 12).
        if (Array.isArray(parsed)) setLines(parsed.filter((l: BasketLine) => SOLD_FORMATS.includes(l.format)));
      }
    } catch {
      // ignore unreadable storage
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore
    }
  }, [lines, ready]);

  const add = useCallback((wine: Wine, format: FormatCode, quantity: number) => {
    const fmt = wine.formats.find((f) => f.code === format);
    if (!fmt || quantity < 1) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.product_code === wine.product_code && l.format === format);
      if (existing) {
        return prev.map((l) =>
          l === existing ? { ...l, quantity: l.quantity + quantity, unit_price: fmt.price } : l
        );
      }
      return [
        ...prev,
        {
          product_code: wine.product_code,
          format,
          quantity,
          name: wine.name,
          producer: wine.producer,
          size: wine.size,
          wine_type: wine.wine_type,
          image_url: wine.image_url,
          unit_price: fmt.price,
        },
      ];
    });
    setAddedAt(Date.now());
  }, []);

  const addAccessory = useCallback((item: Accessory, quantity: number) => {
    if (quantity < 1) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.product_code === item.sku && l.format === "accessory");
      if (existing) {
        return prev.map((l) =>
          l === existing ? { ...l, quantity: Math.min(l.quantity + quantity, 500), unit_price: item.price } : l
        );
      }
      return [
        ...prev,
        {
          product_code: item.sku,
          format: "accessory",
          quantity,
          name: item.name,
          producer: item.brand,
          size: "",
          wine_type: "accessory",
          image_url: item.image_url,
          unit_price: item.price,
          pack: item.pack,
        },
      ];
    });
    setAddedAt(Date.now());
  }, []);

  const setQuantity = useCallback((code: string, format: FormatCode, quantity: number) => {
    setLines((prev) =>
      quantity < 1
        ? prev.filter((l) => !(l.product_code === code && l.format === format))
        : prev.map((l) =>
            l.product_code === code && l.format === format ? { ...l, quantity: Math.min(quantity, 500) } : l
          )
    );
  }, []);

  const remove = useCallback((code: string, format: FormatCode) => {
    setLines((prev) => prev.filter((l) => !(l.product_code === code && l.format === format)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const replacePrices = useCallback(
    (prices: { product_code: string; format: FormatCode; unit_price: string }[]) => {
      setLines((prev) =>
        prev.map((l) => {
          const p = prices.find((x) => x.product_code === l.product_code && x.format === l.format);
          return p && p.unit_price !== l.unit_price ? { ...l, unit_price: p.unit_price } : l;
        })
      );
    },
    []
  );

  const value = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    for (const l of lines) {
      const parts = lineVat(Math.round(Number(l.unit_price) * l.quantity * 100) / 100, l.format);
      subtotal += parts.net;
      vat += parts.vat;
    }
    subtotal = Math.round(subtotal * 100) / 100;
    vat = Math.round(vat * 100) / 100;
    return {
      lines,
      ready,
      add,
      addAccessory,
      setQuantity,
      remove,
      clear,
      replacePrices,
      subtotal,
      vat,
      total: Math.round((subtotal + vat) * 100) / 100,
      bottles: lines.reduce((s, l) => s + FORMAT_BOTTLES[l.format] * l.quantity, 0),
      accessories: lines.reduce((s, l) => s + (l.format === "accessory" ? l.quantity : 0), 0),
      units: lines.reduce((s, l) => s + l.quantity, 0),
      addedAt,
    };
  }, [lines, ready, add, addAccessory, setQuantity, remove, clear, replacePrices, addedAt]);

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used inside BasketProvider");
  return ctx;
}
