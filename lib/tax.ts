// Tax is configured as three named tiers whose percentages live in
// site_settings, and every product or category points at a tier by name. A
// product's own tier wins; otherwise it inherits its category's; otherwise
// standard. Resolving that in one place keeps the storefront, the checkout
// total and the stored order from disagreeing about what a customer owes.

export type TaxTier = "standard" | "reduced" | "special";

export const DEFAULT_TAX_RATES: Record<TaxTier, number> = {
  standard: 20,
  reduced: 10,
  special: 1,
};

export const TAX_TIER_LABELS: Record<TaxTier, { tr: string; en: string }> = {
  standard: { tr: "Standart", en: "Standard" },
  reduced: { tr: "İndirimli", en: "Reduced" },
  special: { tr: "Özel", en: "Special" },
};

export function isTaxTier(value: unknown): value is TaxTier {
  return value === "standard" || value === "reduced" || value === "special";
}

/** Read the three tier percentages out of a site_settings key/value map. */
export function taxRatesFromSettings(
  settings: Record<string, string | undefined>
): Record<TaxTier, number> {
  const read = (key: string, fallback: number) => {
    const n = Number(settings[key]);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : fallback;
  };
  return {
    standard: read("tax_tier_standard", DEFAULT_TAX_RATES.standard),
    reduced: read("tax_tier_reduced", DEFAULT_TAX_RATES.reduced),
    special: read("tax_tier_special", DEFAULT_TAX_RATES.special),
  };
}

/** Effective rate for a product, falling back product → category → standard. */
export function effectiveTaxRate(
  productTier: string | null | undefined,
  categoryTier: string | null | undefined,
  rates: Record<TaxTier, number>
): number {
  const tier = isTaxTier(productTier)
    ? productTier
    : isTaxTier(categoryTier)
    ? categoryTier
    : "standard";
  return rates[tier];
}

/**
 * Split a tax-inclusive gross amount into net and tax.
 *
 * Displayed prices already include tax, so the tax is the portion of the gross
 * rather than a surcharge on top of it: gross − gross / (1 + rate/100).
 */
export function splitInclusiveTax(gross: number, ratePercent: number): { net: number; tax: number } {
  if (!ratePercent) return { net: gross, tax: 0 };
  const net = gross / (1 + ratePercent / 100);
  return { net, tax: gross - net };
}

export type TaxableLine = { gross: number; taxRate: number };

/**
 * Total a cart whose lines may sit in different tiers, and report the tax for
 * each rate present so the customer can see the breakdown rather than one
 * blended number.
 */
export function summariseTax(lines: TaxableLine[]): {
  gross: number;
  net: number;
  tax: number;
  byRate: { rate: number; net: number; tax: number }[];
} {
  const buckets = new Map<number, { rate: number; net: number; tax: number }>();
  let gross = 0;
  let net = 0;
  let tax = 0;

  for (const line of lines) {
    const split = splitInclusiveTax(line.gross, line.taxRate);
    gross += line.gross;
    net += split.net;
    tax += split.tax;

    const bucket = buckets.get(line.taxRate) ?? { rate: line.taxRate, net: 0, tax: 0 };
    bucket.net += split.net;
    bucket.tax += split.tax;
    buckets.set(line.taxRate, bucket);
  }

  return {
    gross,
    net,
    tax,
    byRate: [...buckets.values()].sort((a, b) => b.rate - a.rate),
  };
}
