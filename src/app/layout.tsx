import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Cairo, Inter } from "next/font/google";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["300","400","500","600","700"], variable: "--font-cairo" })
const inter = Inter({ subsets: ["latin"], weight: ["300","400","500","600"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "دوحة رواسترز | Doha Roastery",
  description: "Specialty coffee roastery — قهوة متخصصة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`h-full antialiased ${cairo.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-cream">
        <LanguageProvider><AuthProvider><CartProvider>{children}</CartProvider></AuthProvider></LanguageProvider>
      </body>
    </html>
  );
}
