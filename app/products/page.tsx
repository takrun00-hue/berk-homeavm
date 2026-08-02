import ProductGrid from "@/components/ProductGrid";
import { products } from "@/data/products";

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const filtered = searchParams.category
    ? products.filter(
        (p) =>
          p.category.tr === searchParams.category ||
          p.category.en === searchParams.category
      )
    : products;

  return (
    <section className="py-10">
      <h1 className="text-center text-2xl font-extrabold mb-8">Shop</h1>
      <ProductGrid products={filtered} />
    
