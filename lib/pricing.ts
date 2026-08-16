/**
 * A product's actual selling price: list price with its discount applied.
 *
 * The discount used to be applied only where the price was printed, so the
 * product page showed the reduced figure while the cart, the checkout total
 * and the amount sent to the payment gateway all used the list price. Every
 * place that needs a unit price goes through here instead.
 */
export function discountedUnitPrice(
  priceMin: number,
  discountPercent?: number | null
): number {
  const pct = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  if (!pct) return priceMin;
  return Math.round(priceMin * (1 - pct / 100));
}

/** Convenience for the client, where products arrive as whole objects. */
export function productUnitPrice(product: {
  priceMin: number;
  discountPercent?: number;
}): number {
  return discountedUnitPrice(product.priceMin, product.discountPercent);
}
