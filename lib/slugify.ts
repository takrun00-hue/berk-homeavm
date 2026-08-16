// Turkish letters have no ASCII equivalent under normalize("NFD"), so they are
// mapped explicitly. Everything else is stripped of diacritics and reduced to
// [a-z0-9-], because slugs are read back out of a URL: a slug containing a
// space cannot survive that round-trip. The URL parser strips trailing spaces
// from the href, so a slug ending in one never matches the value stored in the
// database, and every lookup keyed on it fails.
const TURKISH: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
  ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c",
};

export function slugify(input: string): string {
  return input
    .split("")
    .map((ch) => TURKISH[ch] ?? ch)
    .join("")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip remaining combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // any run of non-slug chars becomes one dash
    .replace(/^-+|-+$/g, ""); // no leading or trailing dashes
}

// Slugs already stored may predate slugify() and can carry stray whitespace or
// casing. Normalising both sides of a comparison keeps those rows matchable
// without rewriting them.
export function normalizeSlug(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}
