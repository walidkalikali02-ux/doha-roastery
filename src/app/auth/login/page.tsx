'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import GeometricPattern from '@/components/GeometricPattern'

export default function LoginPage() {
  const { t, dir } = useLang()
  const { signIn } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) {
      setError(t('البريد أو كلمة المرور غير صحيحة', 'Invalid email or password'))
      setLoading(false)
      return
    }
    router.push('/')
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
              {t('دوحة', 'DOHA')}
            </div>
            <div className="text-xs tracking-[0.6em] text-sand uppercase mt-1">
              {t('رواسترز', 'ROASTERY')}
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
            {t('دوحة', 'DOHA')}
          </div>
          <div className="text-[10px] tracking-[0.5em] text-sand uppercase">{t('رواسترز', 'ROASTERY')}</div>
        </Link>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <p className="text-xs tracking-[0.4em] uppercase text-sand mb-2">
            {t('أهلاً بعودتك', 'Welcome Back')}
          </p>
          <h1 className="text-3xl font-light text-charcoal mb-8">
            {t('تسجيل الدخول', 'Sign In')}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                {t('البريد الإلكتروني', 'Email')}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-sand/30 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs tracking-widest uppercase text-charcoal/50">
                  {t('كلمة المرور', 'Password')}
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-sand/30 bg-white px-4 py-3 pe-12 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute top-1/2 -translate-y-1/2 end-4 text-charcoal/30 hover:text-sand transition-colors"
                >
                  {showPass ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-xs tracking-wide bg-red-50 border border-red-100 px-4 py-3">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-charcoal text-cream py-4 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
              ) : (
                <LogIn size={15} strokeWidth={1.5} />
              )}
              {loading ? t('جاري الدخول...', 'Signing in...') : t('دخول', 'Sign In')}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-sm text-charcoal/50">
            {t('ليس لديك حساب؟', "Don't have an account?")}{' '}
            <Link href="/auth/register" className="text-sand hover:text-gold transition-colors font-medium">
              {t('إنشاء حساب', 'Register')}
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
