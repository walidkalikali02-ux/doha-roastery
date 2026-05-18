import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Cairo, Inter } from "next/font/google";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["300","400","500","600","700"], variable: "--font-cairo" })
const inter = Inter({ subsets: ["latin"], weight: ["300","400","500","600"], variable: "--font-inter" })

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Doha Roastery | Specialty Coffee Qatar — قهوة مختصة في الدوحة',
    template: '%s | Doha Roastery Qatar',
  },
  description:
    'Buy specialty coffee beans, capsules, drip pouches and tea online in Qatar. Freshly roasted daily in Doha. Free delivery over 200 QAR. قهوة مختصة تُحمّص يوميًا في الدوحة.',
  keywords:
    'specialty coffee Qatar, buy coffee Doha, قهوة مختصة قطر, Doha Roastery, coffee beans Qatar, Nespresso capsules Qatar, drip coffee Qatar, قهوة مختصة, محمصة قهوة الدوحة',
  authors: [{ name: 'Doha Roastery', url: SITE_URL }],
  creator: 'Doha Roastery',
  openGraph: {
    type: 'website',
    locale: 'ar_QA',
    alternateLocale: 'en_US',
    url: SITE_URL,
    siteName: 'Doha Roastery',
    title: 'Doha Roastery | Specialty Coffee Qatar',
    description:
      'Specialty coffee roasted fresh daily in Doha, Qatar. Shop beans, capsules, drip pouches and more.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@doharoastery',
    creator: '@doharoastery',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: SITE_URL },
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
