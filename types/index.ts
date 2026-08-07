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
  priceMin: number;
  priceMax: number;
  image: string;
  description: LocalizedText;
  discountPercent?: number;
  variants?: ColorVariant[];
}

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  image?: string;
}

export type Locale = "tr" | "en";
