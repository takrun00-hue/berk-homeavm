import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "MY BRAND | Home Furniture",
  description: "Style, comfort and quality combined for your home",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" dir="ltr">
      <body className="bg-base-white text-base-black pb-20 md:pb-0">
        <LanguageProvider>
          <CartProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <MobileBottomNav />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
