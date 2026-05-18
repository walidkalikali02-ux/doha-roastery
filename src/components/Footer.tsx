'use client'
import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'

export default function Footer() {
  const { t, dir } = useLang()
  return (
    <footer className="bg-charcoal text-cream/70 mt-auto" dir={dir}>
      {/* Ornate top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-sand to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-2xl font-light tracking-[0.2em] text-cream uppercase">
              {t('دوحة', 'DOHA')}
            </div>
            <div className="text-[10px] tracking-[0.5em] text-sand uppercase">
              {t('رواسترز', 'ROASTERY')}
            </div>
          </div>
          <p className="text-sm leading-relaxed text-cream/50 max-w-xs">
            {t(
              'قهوة متخصصة محمّصة بعناية، من أجود مصادر العالم إلى فنجانك.',
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
          <a href="https://wa.me/97466788898" target="_blank" rel="noopener noreferrer"
            className="text-sm hover:text-sand transition-colors">+974 6678 8898</a>
        </div>
      </div>

      <div className="border-t border-cream/10 py-6 px-6 text-center text-xs text-cream/30 tracking-widest">
        © {new Date().getFullYear()} {t('دوحة رواسترز', 'Doha Roastery')}
      </div>
    </footer>
  )
}
