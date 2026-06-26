'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/contexts/LanguageContext'
import { getBrandName } from '@/lib/display-text'

export default function Footer() {
  const { t, dir } = useLang()
  return (
    <footer className="bg-charcoal text-cream/70 mt-auto" dir={dir}>
      {/* Ornate top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-sand to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <Image
            src="/logo.png"
            alt={getBrandName(dir === 'rtl' ? 'ar' : 'en')}
            width={220}
            height={110}
            className="h-20 w-auto object-contain brightness-0 invert opacity-90"
          />
          <p className="text-sm leading-relaxed text-cream/50 max-w-xs">
            {t(
              'قهوة مختصة محمّصة بعناية، من أجود مصادر العالم إلى فنجانك.',
              'Specialty coffee roasted with care, from the world\'s finest origins to your cup.'
            )}
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs tracking-widest uppercase text-sand mb-2">
            {t('روابط', 'Links')}
          </h4>
          {[
            { href: '/', ar: 'الرئيسية', en: 'Home' },
            { href: '/products', ar: 'المنتجات', en: 'Products' },
            { href: '/wholesale', ar: 'الجملة', en: 'Wholesale' },
            { href: '/about', ar: 'من نحن', en: 'About' },
            { href: '/contact', ar: 'تواصل معنا', en: 'Contact' },
            { href: '/terms', ar: 'الشروط والأحكام', en: 'Terms' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm hover:text-sand transition-colors w-fit"
            >
              {t(l.ar, l.en)}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs tracking-widest uppercase text-sand mb-2">
            {t('تواصل معنا', 'Contact')}
          </h4>
          <p className="text-sm">{t('الدوحة، قطر', 'Doha, Qatar')}</p>
          <p className="text-sm">info@doharoastery.com</p>
          <a href="https://wa.me/97433337592" target="_blank" rel="noopener noreferrer"
            className="text-sm hover:text-sand transition-colors">+974 3333 7592</a>
        </div>
      </div>

      <div className="border-t border-cream/10 py-6 px-6 text-center text-xs text-cream/30 tracking-widest">
        © {new Date().getFullYear()} {t('دوحة روستري', 'Doha Roastery')}
      </div>
    </footer>
  )
}
