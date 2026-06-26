'use client'

import { MessageCircle } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'

const WHATSAPP_URL = 'https://wa.me/97433337592'

export default function FloatingWhatsAppButton() {
  const { t, dir } = useLang()
  const sideClass = dir === 'rtl' ? 'left-5 sm:left-6' : 'right-5 sm:right-6'

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('تواصل عبر واتساب', 'Chat on WhatsApp')}
      className={`fixed ${sideClass} bottom-5 sm:bottom-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_40px_rgba(37,211,102,0.3)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#1ebe5d] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-cream sm:h-auto sm:w-auto sm:gap-3 sm:px-5 sm:py-3`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full sm:h-8 sm:w-8 sm:bg-white/14">
        <MessageCircle size={24} strokeWidth={1.8} />
      </span>
      <span className="hidden sm:block text-sm font-medium tracking-wide">
        {t('واتساب', 'WhatsApp')}
      </span>
    </a>
  )
}
