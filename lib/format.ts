import type { FormatCode, Order } from "./types";

export function money(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return `£${Number(value).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** The VAT inside a VAT-inclusive amount (20% → one sixth). */
export function vatIncluded(gross: number): number {
  return Math.round(((gross * 0.2) / 1.2) * 100) / 100;
}

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
    default:
      return order.payment_status_label;
  }
}

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@vintage-associates.co.uk";
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "0203 998 3486";
