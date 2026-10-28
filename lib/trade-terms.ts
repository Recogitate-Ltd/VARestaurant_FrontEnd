/**
 * Vintage Associates' terms and conditions of sale, as signed on the trade
 * account application (/apply). The API is the single source, so the signed
 * PDF the team receives says exactly what the applicant read.
 */
import { api } from "@/lib/api";

export type Declaration = "accept_terms" | "confirm_director" | "consent_electronic_signature";

export interface PaymentOption {
  value: string;
  label: string;
  /** Clause 3.2 under this option. */
  clause: string;
  declarations: Record<Declaration, string>;
}

export interface PaymentMethod {
  /** The account's invoice method: "stripe" (card) or "email" (bank transfer). */
  value: string;
  label: string;
  description: string;
}

export interface TradeTerms {
  intro: string;
  sections: { title: string; clauses: string[] }[];
  /** Where the payment clause sits in ``sections`` (0-based). */
  payment_clause: { section: number; clause: number };
  payment_options: PaymentOption[];
  default_payment_option: string;
  payment_methods: PaymentMethod[];
  default_payment_method: string;
}

export function fetchTradeTerms() {
  return api<TradeTerms>("/api/trade/terms/", { auth: false });
}

/** The sections with the payment clause for ``option``. */
export function sectionsFor(terms: TradeTerms, option: PaymentOption) {
  const { section, clause } = terms.payment_clause;
  return terms.sections.map((s, i) =>
    i === section ? { ...s, clauses: s.clauses.map((c, j) => (j === clause ? option.clause : c)) } : s
  );
}
