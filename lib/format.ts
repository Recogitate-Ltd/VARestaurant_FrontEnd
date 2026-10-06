import type { FormatCode, Order, TradeAccount } from "./types";

export function money(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return `£${Number(value).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** The VAT inside a VAT-inclusive amount (20% → one sixth). */
export function vatIncluded(gross: number): number {
  return Math.round(((gross * 0.2) / 1.2) * 100) / 100;
}

/** The 20% VAT added to an ex-VAT amount. */
export function vatOn(net: number): number {
  return Math.round(net * 0.2 * 100) / 100;
}

/**
 * Wine prices are ex VAT (VAT is added at checkout); accessory prices
 * include VAT. Works out a line's amount before VAT and its VAT, the same way
 * the server and the invoice do (per line).
 */
export function lineVat(lineTotal: number, format: FormatCode): { net: number; vat: number } {
  if (format === "accessory") {
    const vat = vatIncluded(lineTotal);
    return { net: Math.round((lineTotal - vat) * 100) / 100, vat };
  }
  return { net: lineTotal, vat: vatOn(lineTotal) };
}

/** The smallest order we take, inc VAT. The server has the final say (see the quote). */
export const MIN_ORDER_TOTAL = Number(process.env.NEXT_PUBLIC_MIN_ORDER_TOTAL || 450);

/** A member (investment-app client) account: no invoice at checkout, billed separately. */
export function isMember(account: Pick<TradeAccount, "kind"> | null | undefined): boolean {
  return account?.kind === "member";
}

/** The sections of the site an account can be shown. The team switches each on or off per account. */
export type Sections = Pick<TradeAccount, "wines_enabled" | "fine_and_rare_enabled" | "accessories_enabled">;

type SectionInfo = { path: string; title: string; browse: string };

/** In the order the site shows them. */
const SECTIONS: { key: keyof Sections; info: SectionInfo }[] = [
  { key: "wines_enabled", info: { path: "/wines", title: "Wines", browse: "Browse wines" } },
  { key: "fine_and_rare_enabled", info: { path: "/fine-and-rare", title: "Fine & Rare", browse: "Browse Fine & Rare" } },
  { key: "accessories_enabled", info: { path: "/accessories", title: "Accessories", browse: "Browse glassware" } },
];

/** A switch missing from an older API response (or no account loaded yet) counts as on. */
function enabled(account: Partial<Sections> | null | undefined, key: keyof Sections): boolean {
  return !account || account[key] !== false;
}

export function seesWines(account: Partial<Sections> | null | undefined): boolean {
  return enabled(account, "wines_enabled");
}

export function seesFineAndRare(account: Partial<Sections> | null | undefined): boolean {
  return enabled(account, "fine_and_rare_enabled");
}

export function seesAccessories(account: Partial<Sections> | null | undefined): boolean {
  return enabled(account, "accessories_enabled");
}

/** The sections this account sees, in site order. Empty when the team has switched them all off. */
export function visibleSections(account: Partial<Sections> | null | undefined): SectionInfo[] {
  return SECTIONS.filter((s) => enabled(account, s.key)).map((s) => s.info);
}

/** Where an approved account starts: the first section it can see, or its orders when none is on. */
export function homePath(account: Partial<Sections> | null | undefined): string {
  return visibleSections(account)[0]?.path ?? "/orders";
}

/** "Browse wines", "Browse Fine & Rare" or "Browse glassware": the first section the account can see. */
export function browseLabel(account: Partial<Sections> | null | undefined): string {
  return visibleSections(account)[0]?.browse ?? "Your orders";
}

/** The minimum order (inc VAT) for this account. Members have none. */
export function minimumOrderFor(account: Pick<TradeAccount, "kind"> | null | undefined): number {
  return isMember(account) ? 0 : MIN_ORDER_TOTAL;
}

/** Formats we still sell. Cases of 3 and 12 were dropped. */
export const SOLD_FORMATS: FormatCode[] = ["bottle", "case6", "accessory"];

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const FORMAT_SHORT: Record<FormatCode, string> = {
  bottle: "Bottle",
  case3: "Case of 3",
  case6: "Case of 6",
  case12: "Case of 12",
  accessory: "Single",
};

/** Bottles in one unit of a format; accessories count none. */
export const FORMAT_BOTTLES: Record<FormatCode, number> = { bottle: 1, case3: 3, case6: 6, case12: 12, accessory: 0 };

/** "Single Pack" → "Single", other pack names as the supplier writes them. */
export function packLabel(pack: string): string {
  return !pack || /^single pack$/i.test(pack) ? "Single" : pack;
}

/** "RIEDEL Veritas Cabernet" → "Veritas Cabernet": the brand is shown separately. */
export function withoutBrand(name: string, brand: string): string {
  return brand && name.toUpperCase().startsWith(`${brand.toUpperCase()} `) ? name.slice(brand.length + 1) : name;
}

/** "Red Wine Glasses" → "Red wine glasses" for chips and headings. */
export function categoryLabel(category: string): string {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

/** "3 bottles", "3 bottles · 2 accessories" or "2 accessories". */
export function contentsSummary(bottles: number, accessories: number): string {
  const parts = [];
  if (bottles || !accessories) parts.push(`${bottles} bottle${bottles === 1 ? "" : "s"}`);
  if (accessories) parts.push(`${accessories} accessor${accessories === 1 ? "y" : "ies"}`);
  return parts.join(" · ");
}

/** Colour swatch for a wine type, used on cards and placeholder bottles. */
export function typeColour(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("rosé") || t.includes("rose")) return "#E59AA6";
  if (t.includes("orange")) return "#D97A2B";
  if (t.includes("dessert")) return "#C98A2B";
  if (t.includes("fortified")) return "#8A4A30";
  if (t.includes("champagne") || t.includes("sparkling") || t.includes("english")) return "#C9B27C";
  if (t.includes("white")) return "#D9C27A";
  if (t.includes("red")) return "#A3303F";
  if (t.includes("spirit")) return "#8C5A2B";
  return "#8A8F93";
}

/** "Red Wine" → "Red", keeps names like "Grand Marque Champagne" as they are. */
export function typeLabel(type: string): string {
  return type.replace(/\s+Wine$/i, "");
}

export function isOverdue(order: Pick<Order, "payment_status" | "due_date">): boolean {
  if (order.payment_status === "overdue") return true;
  if (order.payment_status !== "invoiced" || !order.due_date) return false;
  return new Date(order.due_date) < new Date(new Date().toDateString());
}

export function paymentLabel(order: Pick<Order, "payment_status" | "due_date" | "payment_status_label">): string {
  if (isOverdue(order)) return "Overdue";
  switch (order.payment_status) {
    case "invoiced":
      return "Awaiting payment";
    case "invoice_failed":
    case "pending":
      return "Invoice to follow";
    case "bill_separately":
      return "Order received";
    default:
      return order.payment_status_label;
  }
}

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@vintage-associates.co.uk";
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "0203 998 3486";
