import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import localFont from "next/font/local";

const cairo = localFont({
  src: [
    { path: "../../public/fonts/cairo-300.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/cairo-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/cairo-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/cairo-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/cairo-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cairo",
})
const inter = localFont({
  src: [
    { path: "../../public/fonts/inter-300.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/inter-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/inter-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
})

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'قهوة مختصة في قطر | دوحة روستري',
    template: '%s | دوحة روستري',
  },
  description:
    'تسوّق قهوة مختصة وحبوب قهوة وكبسولات وأدوات تحضير في قطر من دوحة روستري. تحميص بعناية وتوصيل داخل الدوحة وجميع أنحاء قطر.',
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
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: ['/logo.png'],
    apple: [{ url: '/logo.png', type: 'image/png' }],
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
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <FloatingWhatsAppButton />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
