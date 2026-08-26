'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import GeometricPattern from '@/components/GeometricPattern'
import { getBrandName } from '@/lib/display-text'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const { t, dir } = useLang()
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const requestedNext = params.get('next')
  const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/account'
  const oauthCode = params.get('code')
  const oauthError = params.get('oauth_error')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!oauthCode || oauthError) return

    let active = true
    supabase.auth.exchangeCodeForSession(oauthCode).then(({ error: exchangeError }) => {
      if (!active) return
      if (exchangeError) {
        setError(t('تعذر إكمال تسجيل الدخول باستخدام Google.', 'Could not complete Google sign in.'))
        return
      }
      router.replace(next)
    })

    return () => { active = false }
  }, [oauthCode, oauthError, next, router, t])

  const visibleError = error ?? (oauthError ? t('تعذر تسجيل الدخول باستخدام Google.', 'Could not sign in with Google.') : null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const result = await signIn(email.trim(), password)
    setLoading(false)
    if (result.error) {
      setError(t('البريد أو كلمة المرور غير صحيحة.', 'Invalid email or password.'))
      return
    }
    router.push(next)
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)
    const result = await signInWithGoogle(next)
    if (result.error) {
      setLoading(false)
      setError(t('تعذر بدء تسجيل الدخول باستخدام Google.', 'Could not start Google sign in.'))
    }
  }

  return (
    <div className="min-h-screen bg-charcoal flex" dir={dir}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end p-16">
        <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 to-transparent" />
        <div className="relative z-10">
          <Link href="/" className="block mb-12">
            <div className="text-3xl font-light tracking-[0.25em] text-cream uppercase">
              {getBrandName(dir === 'rtl' ? 'ar' : 'en')}
            </div>
          </Link>
          <p className="text-cream/50 text-lg font-light leading-relaxed max-w-sm">
            {t(
              'قهوة مختصة تُحمّص يوميًا في الدوحة',
              'Specialty Coffee Roasted Fresh in Doha'
            )}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-cream flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-20">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden mb-10 block">
          <div className="text-xl font-light tracking-[0.2em] text-charcoal uppercase">
            {getBrandName(dir === 'rtl' ? 'ar' : 'en')}
          </div>
        </Link>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <p className="text-xs tracking-[0.4em] uppercase text-sand mb-2">
            {t('أهلاً بعودتك', 'Welcome Back')}
          </p>
          <h1 className="text-3xl font-light text-charcoal mb-8">
            {t('تسجيل الدخول', 'Sign In')}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                {t('البريد الإلكتروني', 'Email')}
              </label>
              <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-sand/30 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal" />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                {t('كلمة المرور', 'Password')}
              </label>
              <div className="relative">
                <input id="login-password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-sand/30 bg-white px-4 py-3 pe-12 text-sm text-charcoal focus:outline-none focus:border-charcoal" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute top-1/2 end-4 -translate-y-1/2 text-charcoal/30 hover:text-sand" aria-label={t('إظهار كلمة المرور', 'Show password')}>
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {visibleError && <p className="text-red-500 text-xs bg-red-50 border border-red-100 px-4 py-3">{visibleError}</p>}

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-charcoal text-cream py-4 text-sm tracking-widest uppercase hover:bg-charcoal-light disabled:opacity-50">
              {loading ? <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : <LogIn size={15} strokeWidth={1.5} />}
              {loading ? t('جاري الدخول...', 'Signing in...') : t('دخول', 'Sign In')}
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-sand/20" /></div>
              <div className="relative flex justify-center"><span className="bg-cream px-3 text-xs text-charcoal/40">{t('أو', 'OR')}</span></div>
            </div>

            <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-3 border border-charcoal/20 bg-white text-charcoal py-4 text-sm hover:border-charcoal transition-colors disabled:opacity-50">
              <span className="font-semibold text-base">G</span>
              {t('المتابعة باستخدام Google', 'Continue with Google')}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-charcoal/50">
            {t('ليس لديك حساب؟', "Don't have an account?")}{' '}
            <Link href="/auth/register" className="text-sand hover:text-gold font-medium">
              {t('إنشاء حساب', 'Create account')}
            </Link>
          </p>

          <p className="mt-3 text-center">
            <Link href="/" className="text-xs tracking-widest uppercase text-charcoal/30 hover:text-sand transition-colors">
              {t('← العودة للمتجر', '← Back to Store')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
