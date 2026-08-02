import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import VisitTracker from "@/components/VisitTracker";
import TelegramButton from "@/components/TelegramButton";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

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
          <AuthProvider>
            <CartProvider>
              <VisitTracker />
              <Header />
              <main>{children}</main>
              <Footer />
              <TelegramButton />
              <MobileBottomNav />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
