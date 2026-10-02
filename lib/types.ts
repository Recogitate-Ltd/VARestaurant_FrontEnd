// Mirrors the backend `trade` app serializers (/api/trade/). Prices include VAT.

export type FormatCode = "bottle" | "case3" | "case6" | "case12";

export interface WineFormat {
  code: FormatCode;
  label: string;
  bottles: number;
  price: string;
  price_per_bottle: string;
}

export interface Wine {
  id: number;
  product_code: string;
  name: string;
  producer: string;
  country: string;
  region: string;
  wine_type: string;
  grape_variety: string;
  vintage: string;
  abv: string | null;
  size: string;
  closure: string;
  organic: boolean;
  vegan: boolean;
  image_url: string | null;
  /** On this restaurant's own list (orderable at its prices). */
  assigned: boolean;
  /** An open "Request pricing" for this wine is waiting on the team. */
  pricing_requested: boolean;
  from_price: string | null;
  formats: WineFormat[];
}

export interface WineDetail extends Wine {
  tasting_note: string;
  producer_note: string;
  more_from_producer: Wine[];
}

export interface Facet {
  value: string;
  count: number;
}

export interface Facets {
  types: Facet[];
  countries: Facet[];
  regions: Record<string, Facet[]>;
  producers: Facet[];
  closures: Facet[];
  sizes: Facet[];
  grapes: Facet[];
  price_range: { min: string; max: string } | null;
  total: number;
  organic: number;
  vegan: number;
  /** How many wines are on this restaurant's list. */
  my_wines: number;
}

export interface Paginated<T> {
  count: number;
  total_pages: number;
  page: number;
  results: T[];
}

export type AccountStatus = "pending" | "approved" | "rejected" | "suspended";

export interface TradeAccount {
  id: number;
  email: string;
  business_name: string;
  trading_name: string;
  company_number: string;
  vat_number: string;
  contact_name: string;
  phone: string;
  accounts_email: string;
  billing_line1: string;
  billing_line2: string;
  billing_city: string;
  billing_postcode: string;
  delivery_line1: string;
  delivery_line2: string;
  delivery_city: string;
  delivery_postcode: string;
  delivery_instructions: string;
  status: AccountStatus;
  payment_terms_days: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_code: string;
  wine_name: string;
  producer: string;
  size: string;
  format: FormatCode;
  format_label: string;
  bottles_per_unit: number;
  quantity: number;
  bottles: number;
  unit_price: string;
  line_total: string;
  image_url: string | null;
}

export type PaymentStatus = "pending" | "invoiced" | "paid" | "overdue" | "void" | "invoice_failed";

export interface Order {
  id: number;
  reference: string;
  business_name: string;
  payment_status: PaymentStatus;
  payment_status_label: string;
  fulfilment_status: string;
  fulfilment_status_label: string;
  total: string;
  vat_amount: string;
  total_bottles: number;
  item_count?: number;
  po_number: string;
  notes: string;
  delivery_address: string;
  contact_name: string;
  contact_phone: string;
  stripe_invoice_number: string;
  hosted_invoice_url: string;
  invoice_pdf_url: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  items?: OrderItem[];
}
