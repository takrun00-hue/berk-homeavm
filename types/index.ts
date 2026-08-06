export interface LocalizedText {
  tr: string;
  en: string;
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
}

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  image?: string;
}

export type Locale = "tr" | "en";
