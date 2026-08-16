'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ChevronDown,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'

interface Account {
  id: string
  full_name: string | null
  username: string | null
  role: string | null
  avatar_url: string | null
}

interface AccountOrder {
  user_id: string | null
  customer_id: string | null
  total: number | null
  created_at: string
}

type RoleFilter = 'all' | 'ADMIN' | 'MANAGER' | 'CASHIER'

const ROLE_OPTIONS = ['CASHIER', 'MANAGER', 'ADMIN'] as const

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-charcoal text-cream border-charcoal',
  MANAGER: 'bg-sand/15 text-sand-dark border-sand/35',
  CASHIER: 'bg-cream-dark text-charcoal/60 border-sand/20',
}

export default function AdminAccountsClient() {
  const { t, dir, lang } = useLang()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingRole, setSavingRole] = useState<string | null>(null)

  const loadAccounts = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) setRefreshing(true)
    setError(null)

    const [{ data: profileData, error: profileError }, { data: orderData, error: orderError }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, username, role, avatar_url')
        .order('full_name', { ascending: true, nullsFirst: false }),
      supabase
        .from('orders')
        .select('user_id, customer_id, total, created_at')
        .order('created_at', { ascending: false }),
    ])

    if (profileError || orderError) {
      setError(lang === 'ar' ? 'تعذر تحميل الحسابات. حاول مرة أخرى.' : 'Could not load accounts. Please try again.')
    } else {
      setAccounts((profileData as Account[]) ?? [])
      setOrders((orderData as AccountOrder[]) ?? [])
    }

    setLoading(false)
    setRefreshing(false)
  }, [lang])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadAccounts()
    }, 0)
    return () => window.clearTimeout(initialLoad)
  }, [loadAccounts])

  useEffect(() => {
    const profileChannel = supabase
      .channel('admin-accounts-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void loadAccounts()
      })
      .subscribe()
    const orderChannel = supabase
      .channel('admin-accounts-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void loadAccounts()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(profileChannel)
      void supabase.removeChannel(orderChannel)
    }
  }, [loadAccounts])

  async function updateRole(accountId: string, role: string) {
    setSavingRole(accountId)
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', accountId)
      .select('id, full_name, username, role, avatar_url')
      .single()

    if (updateError || !data) {
      setError(t('تعذر تحديث الصلاحية.', 'Could not update the role.'))
    } else {
      setAccounts((current) => current.map((account) => account.id === accountId ? data as Account : account))
    }
    setSavingRole(null)
  }

  const filteredAccounts = accounts.filter((account) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [account.full_name, account.username, account.id]
      .some((value) => value?.toLowerCase().includes(query))
    const matchesRole = roleFilter === 'all' || account.role === roleFilter
    return matchesSearch && matchesRole
  })

  const linkedOrders = orders.filter((order) => order.user_id || order.customer_id)
  const staffCount = accounts.filter((account) => account.role === 'ADMIN' || account.role === 'MANAGER').length
  const newAccounts = accounts.filter((account) => account.role === 'CASHIER').length
  const revenue = orders.reduce((total, order) => total + (order.total ?? 0), 0)

  const summaryCards = [
    {
      label: t('إجمالي الحسابات', 'Total Accounts'),
      value: accounts.length,
      detail: t('حسابات مسجلة', 'Registered accounts'),
      icon: Users,
    },
    {
      label: t('الفريق الإداري', 'Admin Team'),
      value: staffCount,
      detail: t('مديرون ومشرفون', 'Managers and admins'),
      icon: ShieldCheck,
    },
    {
      label: t('حسابات العملاء', 'Customer Accounts'),
      value: newAccounts,
      detail: t('صلاحية العميل', 'Customer access'),
      icon: UserRoundPlus,
    },
    {
      label: t('الطلبات المرتبطة', 'Linked Orders'),
      value: linkedOrders.length,
      detail: `${revenue.toFixed(0)} ${t('ر.ق إجمالي', 'QAR total')}`,
      icon: ShoppingBag,
    },
  ]

  function accountOrders(accountId: string) {
    return orders.filter((order) => order.user_id === accountId || order.customer_id === accountId)
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(dir === 'rtl' ? 'ar-QA' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div dir={dir} className="space-y-7">
      <section className="relative overflow-hidden bg-charcoal px-6 py-7 text-cream md:px-8 md:py-9">
        <div className="absolute -end-16 -top-24 h-64 w-64 rounded-full border border-sand/20" />
        <div className="absolute -end-4 -top-12 h-40 w-40 rounded-full border border-sand/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[10px] tracking-[0.35em] text-sand uppercase">
              {t('دليل الحسابات', 'Account directory')}
            </p>
            <h2 className="max-w-xl text-3xl font-light tracking-tight md:text-4xl">
              {t('اعرف عملاءك وفريقك في لمحة.', 'Know your customers and team at a glance.')}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-cream/55">
              {t('تابع الحسابات المرتبطة بالطلبات واضبط الصلاحيات من مكان واحد.', 'Track accounts connected to orders and manage access from one place.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAccounts(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 border border-cream/20 px-4 py-2.5 text-xs tracking-[0.18em] text-cream/70 uppercase transition-colors hover:border-sand hover:text-sand disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} strokeWidth={1.5} />
            {t('تحديث البيانات', 'Refresh data')}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {summaryCards.map((card) => (
          <div key={card.label} className="border border-sand/20 bg-white p-4 md:p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <p className="text-[10px] tracking-[0.2em] text-charcoal/45 uppercase">{card.label}</p>
              <card.icon size={17} strokeWidth={1.4} className="text-sand" />
            </div>
            <p className="text-3xl font-light text-charcoal"><bdi dir="ltr">{card.value}</bdi></p>
            <p className="mt-1 text-[11px] text-charcoal/40">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="border border-sand/20 bg-white">
          <div className="border-b border-sand/10 px-5 py-5 md:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-sm tracking-[0.2em] text-charcoal uppercase">
                  {t('الحسابات', 'Accounts')} <span className="text-charcoal/35">({filteredAccounts.length})</span>
                </h3>
                <p className="mt-1 text-xs text-charcoal/40">
                  {t('ابحث بالاسم أو البريد الإلكتروني', 'Search by name or email')}
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-sand" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('بحث في الحسابات...', 'Search accounts...')}
                  aria-label={t('بحث في الحسابات', 'Search accounts')}
                  className="w-full border border-sand/25 bg-cream/20 py-2.5 ps-9 pe-3 text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/30 focus:border-charcoal"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(['all', ...ROLE_OPTIONS] as RoleFilter[]).map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`border px-3 py-1.5 text-[10px] tracking-[0.16em] uppercase transition-colors ${
                    roleFilter === role
                      ? 'border-charcoal bg-charcoal text-cream'
                      : 'border-sand/25 text-charcoal/50 hover:border-charcoal/50'
                  }`}
                >
                  {role === 'all' ? t('الكل', 'All') : role}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-sm tracking-widest text-sand">
              {t('جاري تحميل الحسابات...', 'Loading accounts...')}
            </div>
          ) : error ? (
            <div role="alert" className="m-5 border border-red-100 bg-red-50 px-4 py-8 text-center text-sm text-red-500">
              {error}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <Users size={30} strokeWidth={1.2} className="mb-3 text-sand/50" />
              <p className="text-sm text-charcoal/45">{t('لا توجد حسابات مطابقة.', 'No matching accounts.')}</p>
            </div>
          ) : (
            <div className="divide-y divide-sand/10">
              {filteredAccounts.map((account) => {
                const accountOrderList = accountOrders(account.id)
                const accountRevenue = accountOrderList.reduce((total, order) => total + (order.total ?? 0), 0)
                const lastOrder = accountOrderList[0]
                const role = account.role ?? 'CASHIER'

                return (
                  <div key={account.id} className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-cream/25 md:flex-row md:items-center md:px-6">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand/10 text-sm text-sand">
                        {(account.full_name?.trim().charAt(0) || account.username?.charAt(0) || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-charcoal">
                          {account.full_name || t('بدون اسم', 'Unnamed account')}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-charcoal/40">
                          <Mail size={11} strokeWidth={1.5} />
                          {account.username || t('بريد غير متوفر', 'Email unavailable')}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-start md:min-w-[310px] md:border-s md:border-sand/10 md:ps-5">
                      <div>
                        <p className="text-[10px] tracking-[0.14em] text-charcoal/35 uppercase">{t('الطلبات', 'Orders')}</p>
                        <p className="mt-1 text-sm text-charcoal"><bdi dir="ltr">{accountOrderList.length}</bdi></p>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-[0.14em] text-charcoal/35 uppercase">{t('الإنفاق', 'Spend')}</p>
                        <p className="mt-1 text-sm text-charcoal"><bdi dir="ltr">{accountRevenue.toFixed(0)}</bdi> <span className="text-[10px] text-sand">{t('ر.ق', 'QAR')}</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-[0.14em] text-charcoal/35 uppercase">{t('آخر طلب', 'Last order')}</p>
                        <p className="mt-1 text-xs text-charcoal/60">{lastOrder ? formatDate(lastOrder.created_at) : '—'}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex shrink-0 items-center">
                      <span className="sr-only">{t('صلاحية الحساب', 'Account role')}</span>
                      <select
                        value={role}
                        onChange={(event) => void updateRole(account.id, event.target.value)}
                        disabled={savingRole === account.id}
                        className={`appearance-none border py-2 pe-8 ps-3 text-[10px] tracking-[0.16em] uppercase outline-none transition-colors disabled:opacity-50 ${ROLE_STYLES[role] ?? ROLE_STYLES.CASHIER}`}
                      >
                        {ROLE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                      <ChevronDown size={12} className="pointer-events-none absolute end-2 text-current" />
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <aside className="flex flex-col justify-between border border-sand/20 bg-cream-dark/50 p-6">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-sand-dark uppercase">{t('ملاحظة تشغيلية', 'Operations note')}</p>
            <h3 className="mt-3 max-w-xs text-2xl font-light leading-tight text-charcoal">
              {t('الحسابات المرتبطة تعطيك سياقاً أفضل لكل طلب.', 'Linked accounts give every order more context.')}
            </h3>
            <p className="mt-4 text-sm leading-6 text-charcoal/55">
              {t('تظهر الطلبات التي تم إنشاؤها قبل تسجيل الدخول كطلبات ضيوف حتى يتم ربطها بالحساب.', 'Orders created before sign-in remain guest orders until they are linked to an account.')}
            </p>
          </div>
          <div className="mt-10 border-t border-sand/20 pt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-charcoal/45">{t('طلبات ضيوف غير مرتبطة', 'Unlinked guest orders')}</span>
              <bdi dir="ltr" className="text-lg font-light text-charcoal">{orders.length - linkedOrders.length}</bdi>
            </div>
            <div className="mt-3 h-1 bg-cream-dark">
              <div
                className="h-full bg-sand transition-all"
                style={{ width: `${orders.length ? Math.min((linkedOrders.length / orders.length) * 100, 100) : 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-charcoal/35">
              {t('نسبة الطلبات المرتبطة بالحسابات', 'Share of orders linked to accounts')}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
