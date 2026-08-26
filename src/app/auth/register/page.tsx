'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import GeometricPattern from '@/components/GeometricPattern'
import { getBrandName } from '@/lib/display-text'

export default function RegisterPage() {
  const { t, dir } = useLang()
  const { signUp } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 6) {
      setError(t('يجب أن تتكون كلمة المرور من ٦ أحرف على الأقل.', 'Password must be at least 6 characters.'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('كلمة المرور غير متطابقة.', 'Passwords do not match.'))
      return
    }

    setLoading(true)
    setError(null)
    const result = await signUp(email.trim(), password, fullName.trim())
    setLoading(false)
    if (result.error) {
      setError(t('تعذر إنشاء الحساب. قد يكون البريد مستخدمًا بالفعل.', 'Could not create the account. The email may already be in use.'))
      return
    }
    if (result.authenticated) {
      router.replace('/account')
      return
    }
    setCreated(true)
  }

  if (created) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6" dir={dir}>
        <div className="max-w-sm w-full text-center">
          <h1 className="text-3xl font-light text-charcoal mb-4">{t('تم إنشاء الحساب', 'Account created')}</h1>
          <p className="text-sm text-charcoal/60 mb-8">
            {t('تحقق من بريدك الإلكتروني إذا طُلب منك ذلك، ثم سجّل الدخول باستخدام بريدك وكلمة المرور.', 'Confirm your email if requested, then sign in with your email and password.')}
          </p>
          <button onClick={() => router.push('/auth/login')} className="bg-charcoal text-cream px-8 py-3.5 text-sm tracking-widest uppercase hover:bg-charcoal-light">
            {t('تسجيل الدخول', 'Sign in')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-charcoal flex" dir={dir}>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end p-16">
        <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 to-transparent" />
        <div className="relative z-10">
          <Link href="/" className="block mb-12">
            <div className="text-3xl font-light tracking-[0.25em] text-cream uppercase">{getBrandName(dir === 'rtl' ? 'ar' : 'en')}</div>
          </Link>
          <p className="text-cream/50 text-lg font-light leading-relaxed max-w-sm">{t('أنشئ حسابك لمتابعة طلباتك بسهولة.', 'Create an account to keep track of your orders.')}</p>
        </div>
      </div>

      <div className="flex-1 bg-cream flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-20">
        <Link href="/" className="lg:hidden mb-10 block">
          <div className="text-xl font-light tracking-[0.2em] text-charcoal uppercase">{getBrandName(dir === 'rtl' ? 'ar' : 'en')}</div>
        </Link>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <p className="text-xs tracking-[0.4em] uppercase text-sand mb-2">{t('مرحباً بك', 'Welcome')}</p>
          <h1 className="text-3xl font-light text-charcoal mb-8">{t('إنشاء حساب', 'Create account')}</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label={t('الاسم الكامل', 'Full name')} value={fullName} onChange={setFullName} autoComplete="name" />
            <Field label={t('البريد الإلكتروني', 'Email')} type="email" value={email} onChange={setEmail} autoComplete="email" />
            <Field label={t('كلمة المرور', 'Password')} type="password" value={password} onChange={setPassword} autoComplete="new-password" />
            <Field label={t('تأكيد كلمة المرور', 'Confirm password')} type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />

            {error && <p className="text-red-500 text-xs bg-red-50 border border-red-100 px-4 py-3">{error}</p>}

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-charcoal text-cream py-4 text-sm tracking-widest uppercase hover:bg-charcoal-light disabled:opacity-50">
              {loading ? <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : <UserPlus size={15} strokeWidth={1.5} />}
              {loading ? t('جاري الإنشاء...', 'Creating...') : t('إنشاء الحساب', 'Create account')}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-charcoal/50">
            {t('لديك حساب بالفعل؟', 'Already have an account?')}{' '}
            <Link href="/auth/login" className="text-sand hover:text-gold font-medium">{t('تسجيل الدخول', 'Sign in')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete: string
}) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{label}</label>
      <input type={type} required autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-sand/30 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal" />
    </div>
  )
}
