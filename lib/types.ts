// Mirrors the backend `trade` app serializers (/api/trade/).
// Wine prices are ex VAT (VAT is added at checkout); accessory prices include VAT.

/** Wines are sold as bottles (£10+ a bottle only) and cases of 6. Cases of 3 and
 * 12 are no longer sold but still appear on older orders. */
export type FormatCode = "bottle" | "case3" | "case6" | "case12" | "accessory";

export interface WineFormat {
  code: Exclude<FormatCode, "accessory">;
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
  /** How many of this restaurant's "Request pricing" asks are still waiting on the team. */
  open_price_requests: number;
}

export type PriceRequestStatus = "open" | "priced" | "declined";

/** A restaurant's own "Request pricing" ask (/api/trade/price-requests/). */
export interface PriceRequest {
  id: number;
  product_code: string;
  wine_name: string;
  producer: string;
  vintage: string;
  size: string;
  wine_type: string;
  /** False once the wine has left the catalogue. */
  wine_available: boolean;
  image_url: string | null;
  note: string;
  status: PriceRequestStatus;
  status_label: string;
  response_note: string;
  resolved_at: string | null;
  created_at: string;
}

/** A Fine & Rare wine (/api/trade/fine-and-rare/): a premium Bordeaux Index
 * wine sourced to order. Never priced on the site: restaurants request a quote. */
export interface FineWine {
  id: number;
  name: string;
  producer: string | null;
  vintage: string | null;
  country: string | null;
  region: string | null;
  /** BI's colour, e.g. "Red", "White", "Sparkling". */
  colour: string | null;
  pack_size: number;
  bottle_size: string | null;
  /** "Case of 6 × 75cl" or "Single bottle (150cl)". */
  format_label: string;
  abv: string | null;
  image_url: string | null;
  grape_variety: string | null;
  taste_profile: string | null;
  food_pairing: string | null;
  /** An open request for this wine is waiting on the team. */
  requested: boolean;
  /** "3-4 weeks". */
  delivery_estimate: string;
}

export interface FineWineFacets {
  colours: Facet[];
  total: number;
  open_requests: number;
}

export type FineWineRequestStatus = "open" | "quoted" | "declined";

/** A restaurant's own Fine & Rare request (/api/trade/fine-and-rare/requests/). */
export interface FineWineRequest {
  id: number;
  /** Null once the wine has left Bordeaux Index's list. */
  wine_id: number | null;
  wine_name: string;
  producer: string;
  vintage: string;
  format_label: string;
  image_url: string | null;
  /** Number of cases. */
  quantity: number;
  note: string;
  status: FineWineRequestStatus;
  status_label: string;
  response_note: string;
  resolved_at: string | null;
  created_at: string;
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
  /** "member": an investment-app client given access by the team. Orders aren't invoiced here; they're billed separately. */
  kind: "restaurant" | "member";
  /** False when the account only sees accessories (glassware). */
  wines_enabled: boolean;
  payment_terms_days: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  item_type: "wine" | "accessory";
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
  /** True when unit_price / line_total include VAT (accessories, and every line on older orders). */
  vat_included: boolean;
  image_url: string | null;
}

export type PaymentStatus =
  | "pending"
  | "invoiced"
  | "paid"
  | "overdue"
  | "void"
  | "invoice_failed"
  /** Member orders: no invoice here, the team bills the member directly. */
  | "bill_separately";

export interface Order {
  id: number;
  reference: string;
  business_name: string;
  payment_status: PaymentStatus;
  payment_status_label: string;
  fulfilment_status: string;
  fulfilment_status_label: string;
  /** Before VAT. */
  subtotal: string;
  vat_amount: string;
  /** Including VAT. */
  total: string;
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

/** Glassware, decanters and care from Riedel, Spiegelau and Nachtmann (/api/trade/accessories/). */
export interface Accessory {
  id: number;
  sku: string;
  name: string;
  brand: string;
  collection: string;
  category: string;
  sub_category: string;
  /** e.g. "Set of 2", "Value Pack - Buy 3 Get 4". */
  pack: string;
  pieces: number;
  /** "New", "Limited Edition" or "". */
  label: string;
  colour: string;
  glassware_type: string;
  image_url: string | null;
  /** The supplier's retail price, inc VAT. */
  rrp: string;
  /** What this restaurant pays, inc VAT. */
  price: string;
  price_per_piece: string;
  /** Whole % below RRP, or null when not below it. */
  saving_percent: number | null;
}

export interface AccessoryDetail extends Accessory {
  description: string;
  fabrication: string;
  material: string;
  height_mm: number | null;
  diameter_mm: number | null;
  pour_ml: number | null;
  recommended_for: string[];
  /** The same glass in other pack sizes. */
  other_packs: Accessory[];
  more_from_collection: Accessory[];
}

export interface AccessoryFacets {
  categories: Facet[];
  brands: Facet[];
  collections: Facet[];
  price_range: { min: string; max: string } | null;
  total: number;
}
