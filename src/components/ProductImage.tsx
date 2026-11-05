'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ImageOff } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'

interface Props {
  src: string | null
  alt: string
  className?: string
  href?: string
  loading?: 'eager' | 'lazy'
}

export default function ProductImage(props: Props) {
  // Reset failed-image state when a different product photo is supplied.
  return <ProductImageContent key={props.src} {...props} />
}

function ProductImageContent({ src, alt, className = '', href, loading = 'lazy' }: Props) {
  const { t } = useLang()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  if (!src || failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2 text-center text-charcoal/60">
        <ImageOff size={24} strokeWidth={1.3} aria-hidden="true" />
        <span className="text-xs">{t('الصورة غير متاحة', 'Photo unavailable')}</span>
        {src && (
          <button
            type="button"
            className="min-h-10 px-3 text-xs underline underline-offset-4 hover:text-charcoal focus-visible:outline-2"
            onClick={() => { setAttempt((value) => value + 1); setFailed(false) }}
            aria-label={t(`إعادة تحميل صورة ${alt}`, `Reload photo of ${alt}`)}
          >
            {t('إعادة المحاولة', 'Try again')}
          </button>
        )}
      </div>
    )
  }

  const image = (
    // Product photos are served directly from public storage.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={attempt}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={`w-full h-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  )

  return href ? <Link href={href} className="block w-full h-full">{image}</Link> : image
}
