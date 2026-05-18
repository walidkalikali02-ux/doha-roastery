'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import GeometricPattern from '@/components/GeometricPattern'

export default function RegisterPage() {
  const { t, dir } = useLang()
  const { signUp } = useAuth()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const strong = password.length >= 6

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!strong) {
      setError(t('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'Password must be at least 6 characters'))
      return
    }
    if (password !== confirm) {
      setError(t('كلمة المرور غير متطابقة', 'Passwords do not match'))
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await signUp(email, password, fullName)
    if (error) {
      setError(error)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6" dir={dir}>
        <div className="max-w-sm w-full text-center">
          <CheckCircle size={48} strokeWidth={1} className="text-sand mx-auto mb-6" />
          <h2 className="text-2xl font-light text-charcoal mb-3">
            {t('تم إنشاء حسابك!', 'Account Created!')}
          </h2>
          <p className="text-sm text-charcoal/60 mb-8">
            {t(
              'تحقق من بريدك الإلكتروني لتأكيد الحساب، ثم سجّل دخولك.',
              'Check your email to confirm your account, then sign in.'
            )}
          </p>
          <Link href="/auth/login">
            <span className="inline-block bg-charcoal text-cream px-8 py-3.5 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors">
              {t('تسجيل الدخول', 'Sign In')}
            </span>
          </Link>
        </div>
      </div>
    )
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
              'انضم إلى مجتمع محبي القهوة',
              'Join our community of coffee lovers'
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
            {t('مرحباً بك', 'Welcome')}
          </p>
          <h1 className="text-3xl font-light text-charcoal mb-8">
            {t('إنشاء حساب', 'Create Account')}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div>
              <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                {t('الاسم الكامل', 'Full Name')}
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-sand/30 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
              />
            </div>

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
              <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                {t('كلمة المرور', 'Password')}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
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
              {/* Strength indicator */}
              {password && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-0.5 flex-1 transition-colors ${
                        password.length >= i * 4 ? 'bg-sand' : 'bg-sand/20'
                      }`}
                    />
                  ))}
                </div>
              )}
              <p className="text-[10px] text-charcoal/30 mt-1">
                {t('6 أحرف كحد أدنى', 'Minimum 6 characters')}
              </p>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                {t('تأكيد كلمة المرور', 'Confirm Password')}
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full border bg-white px-4 py-3 text-sm text-charcoal focus:outline-none transition-colors ${
                  confirm && confirm !== password
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-sand/30 focus:border-charcoal'
                }`}
              />
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
                <UserPlus size={15} strokeWidth={1.5} />
              )}
              {loading ? t('جاري الإنشاء...', 'Creating...') : t('إنشاء الحساب', 'Create Account')}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-charcoal/50">
            {t('لديك حساب بالفعل؟', 'Already have an account?')}{' '}
            <Link href="/auth/login" className="text-sand hover:text-gold transition-colors font-medium">
              {t('تسجيل الدخول', 'Sign In')}
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
