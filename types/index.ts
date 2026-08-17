export interface LocalizedText {
  tr: string;
  en: string;
}

export interface ColorVariant {
  name: string;
  hex: string;
  image: string;
}

export interface Product {
  id: string;
  slug: string;
  name: LocalizedText;
  category: LocalizedText;
  categorySlug?: string;
  categoryId?: string | null;
  priceMin: number;
  priceMax: number;
  image: string;
  description: LocalizedText;
  discountPercent?: number;
  variants?: ColorVariant[];
  /** Effective VAT percentage, resolved product → category → standard tier. */
  taxRate?: number;
  /** Units in stock. null means stock is not tracked for this product. */
  stock?: number | null;
}

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  image?: string;
}

export type Locale = "tr" | "en";
