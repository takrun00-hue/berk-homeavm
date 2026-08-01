export function formatPrice(value: number, locale: "tr" | "en" = "tr"): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US").format(value);
}
