import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import localFont from "next/font/local";
import { safeJsonLd } from "@/lib/json-ld";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_NAME_AR, SITE_URL } from "@/lib/seo";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'قهوة مختصة في قطر | دوحة روستري',
    template: '%s',
  },
  description:
    'تسوّق قهوة مختصة وحبوب قهوة وكبسولات وأدوات تحضير في قطر من دوحة روستري. تحميص بعناية وتوصيل داخل الدوحة وجميع أنحاء قطر.',
  applicationName: SITE_NAME,
  keywords: ['specialty coffee Qatar', 'coffee roaster Doha', 'buy coffee Doha', 'قهوة مختصة قطر', 'محمصة قهوة الدوحة', 'coffee beans Qatar', 'Nespresso capsules Qatar', 'drip coffee Qatar', SITE_NAME, SITE_NAME_AR],
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
    images: [{ url: DEFAULT_OG_IMAGE, alt: `${SITE_NAME} | ${SITE_NAME_AR}` }],
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
  category: 'Specialty coffee',
  other: {
    'geo.region': 'QA-DA',
    'geo.placename': 'Doha, Qatar',
    ICBM: '25.2854, 51.5310',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'LocalBusiness', 'CafeOrCoffeeShop'],
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: SITE_NAME_AR,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        image: `${SITE_URL}/logo.png`,
        description: 'Specialty coffee roastery serving individuals, cafes, hotels, and restaurants across Qatar.',
        telephone: '+97433337592',
        email: 'info@doharoastery.com',
        priceRange: '$$',
        currenciesAccepted: 'QAR',
        areaServed: { '@type': 'Country', name: 'Qatar' },
        address: { '@type': 'PostalAddress', addressLocality: 'Doha', addressCountry: 'QA' },
        geo: { '@type': 'GeoCoordinates', latitude: 25.2854, longitude: 51.531 },
        openingHoursSpecification: [{
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          opens: '08:00',
          closes: '22:00',
        }],
        sameAs: ['https://instagram.com/doharoastery', 'https://twitter.com/doharoastery'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: SITE_NAME_AR,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: ['ar-QA', 'en'],
      },
    ],
  }

  return (
    <html lang="ar" dir="rtl" className={`h-full antialiased ${cairo.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-cream">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }} />
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
