import { Metadata } from 'next'
import WholesaleClient from './WholesaleClient'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

export const metadata: Metadata = {
  title: 'Wholesale Coffee Qatar | B2B Program | برنامج الجملة — دوحة روستري',
  description:
    'برنامج جملة القهوة المتخصصة في قطر — للمقاهي والفنادق والمطاعم. خصومات تصل إلى ٢٥٪، توصيل منتظم، جودة مضمونة. Wholesale specialty coffee for cafés, hotels & restaurants in Qatar.',
  keywords:
    'wholesale coffee Qatar, قهوة جملة قطر, B2B coffee Doha, specialty coffee supplier Qatar, مورد قهوة مختصة قطر, coffee supplier Doha, جملة قهوة الدوحة, Doha Roastery wholesale',
  alternates: { canonical: `${SITE_URL}/wholesale` },
  openGraph: {
    title: 'Wholesale Coffee Qatar | برنامج الجملة — دوحة روستري',
    description: 'Specialty coffee wholesale for Qatar businesses. Tiered discounts up to 25%, reliable delivery, dedicated support. Apply for partnership today.',
    url: `${SITE_URL}/wholesale`,
    siteName: 'Doha Roastery',
    locale: 'ar_QA',
    type: 'website',
  },
}

export default function WholesalePage() {
  return <WholesaleClient />
}
