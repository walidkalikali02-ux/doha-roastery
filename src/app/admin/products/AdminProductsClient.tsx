'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Search, CheckSquare, Square } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import ImageUpload from '@/components/ImageUpload'

interface Props { initialProducts: Product[] }

const EMPTY_PRODUCT: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
  name: '', sku: '', category: '', description: '', price: 0,
  compare_at_price: null, cost_per_item: null, quantity: 0,
  low_stock_threshold: 10, status: 'draft', image_url: '', tags: [], in_stock: true,
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
}

export default function AdminProductsClient({ initialProducts }: Props) {
  const { t, dir } = useLang()
  const [products, setProducts]     = useState<Product[]>(initialProducts)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [modal, setModal]           = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [form, setForm]             = useState<typeof EMPTY_PRODUCT>({ ...EMPTY_PRODUCT })
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const filtered     = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const allChecked   = filtered.length > 0 && filtered.every(p => selected.has(p.id))
  const someChecked  = filtered.some(p => selected.has(p.id))

  /* ── Selection helpers ── */
  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allChecked) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(p => next.delete(p.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(p => next.add(p.id))
        return next
      })
    }
  }

  function clearSelection() { setSelected(new Set()) }

  /* ── Bulk delete ── */
  async function handleBulkDelete() {
    if (!confirm(t(
      `هل أنت متأكد من حذف ${selected.size} منتج؟ لا يمكن التراجع عن هذا الإجراء.`,
      `Delete ${selected.size} selected product(s)? This cannot be undone.`
    ))) return

    setBulkDeleting(true)
    const ids = Array.from(selected)
    const { error: err } = await supabase
      .from('ecommerce_products')
      .delete()
      .in('id', ids)

    if (!err) {
      setProducts(prev => prev.filter(p => !selected.has(p.id)))
      setSelected(new Set())
    }
    setBulkDeleting(false)
  }

  /* ── Single delete ── */
  async function handleDelete(id: string) {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Delete this product?'))) return
    setDeleting(id)
    const { error: err } = await supabase.from('ecommerce_products').delete().eq('id', id)
    if (!err) {
      setProducts(prev => prev.filter(p => p.id !== id))
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
    }
    setDeleting(null)
  }

  /* ── Create / Edit ── */
  function openCreate() {
    setForm({ ...EMPTY_PRODUCT }); setEditingId(null); setModal('create'); setError(null)
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, sku: p.sku, category: p.category, description: p.description,
      price: p.price, compare_at_price: p.compare_at_price, cost_per_item: p.cost_per_item,
      quantity: p.quantity, low_stock_threshold: p.low_stock_threshold, status: p.status,
      image_url: p.image_url, tags: p.tags, in_stock: p.in_stock,
    })
    setEditingId(p.id); setModal('edit'); setError(null)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError(t('الاسم مطلوب', 'Name is required')); return }
    setSaving(true); setError(null)
    try {
      if (modal === 'create') {
        const { data, error: err } = await supabase.from('ecommerce_products').insert([form]).select().single()
        if (err) throw err
        setProducts([data as Product, ...products])
      } else if (editingId) {
        const { data, error: err } = await supabase.from('ecommerce_products').update(form).eq('id', editingId).select().single()
        if (err) throw err
        setProducts(products.map(p => p.id === editingId ? (data as Product) : p))
      }
      setModal(null)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const F = (key: keyof typeof EMPTY_PRODUCT) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.type === 'number' ? Number(e.target.value)
        : e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm({ ...form, [key]: val })
    }

  const STATUS_LABELS: Record<string, string> = {
    active: t('نشط', 'Active'),
    draft:  t('مسودة', 'Draft'),
    archived: t('مؤرشف', 'Archived'),
  }

  return (
    <div dir={dir} className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm tracking-widest uppercase text-charcoal">
          {t('المنتجات', 'Products')} ({products.length})
        </h2>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-charcoal text-cream px-4 py-2.5 text-xs tracking-widest uppercase hover:bg-charcoal-light transition-colors">
          <Plus size={14} />
          {t('منتج جديد', 'New Product')}
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-sand" />
        <input type="text" placeholder={t('بحث...', 'Search...')} value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full ps-9 pe-4 py-2.5 border border-sand/30 bg-white text-sm text-charcoal focus:outline-none focus:border-charcoal" />
      </div>

      {/* ── Bulk action bar (visible when items selected) ── */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-red-700">
              {t(`تم اختيار ${selected.size} منتج`, `${selected.size} product(s) selected`)}
            </span>
            <button onClick={clearSelection}
              className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors">
              {t('إلغاء التحديد', 'Clear selection')}
            </button>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 text-xs tracking-widest uppercase hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {bulkDeleting
              ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Trash2 size={13} strokeWidth={2} />
            }
            {bulkDeleting
              ? t('جاري الحذف...', 'Deleting...')
              : t(`حذف ${selected.size} منتج`, `Delete ${selected.size}`)}
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-sand/20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand/10 bg-cream">
              {/* Select all checkbox */}
              <th className="px-4 py-3 w-10">
                <button onClick={toggleAll} className="flex items-center justify-center text-charcoal/40 hover:text-charcoal transition-colors">
                  {allChecked
                    ? <CheckSquare size={16} strokeWidth={1.5} className="text-charcoal" />
                    : someChecked
                      ? <CheckSquare size={16} strokeWidth={1.5} className="text-sand" />
                      : <Square size={16} strokeWidth={1.5} />
                  }
                </button>
              </th>
              {[
                t('المنتج', 'Product'),
                t('الفئة', 'Category'),
                t('السعر', 'Price'),
                t('المخزون', 'Stock'),
                t('الحالة', 'Status'),
              ].map(h => (
                <th key={h} className="text-start px-4 py-3 text-[10px] tracking-widest uppercase text-charcoal/50 font-normal">
                  {h}
                </th>
              ))}
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/10">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-charcoal/30 tracking-widest text-xs">
                  {t('لا توجد منتجات', 'No products')}
                </td>
              </tr>
            )}
            {filtered.map(p => {
              const isSelected = selected.has(p.id)
              return (
                <tr key={p.id}
                  className={`transition-colors ${isSelected ? 'bg-red-50/50' : 'hover:bg-cream/50'}`}>

                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <button onClick={() => toggleOne(p.id)}
                      className="flex items-center justify-center text-charcoal/30 hover:text-charcoal transition-colors">
                      {isSelected
                        ? <CheckSquare size={16} strokeWidth={1.5} className="text-red-500" />
                        : <Square size={16} strokeWidth={1.5} />
                      }
                    </button>
                  </td>

                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cream-dark flex-shrink-0 overflow-hidden">
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          : <span className="flex items-center justify-center h-full text-lg opacity-30">☕</span>
                        }
                      </div>
                      <div>
                        <p className="font-medium text-charcoal line-clamp-1">{p.name}</p>
                        {p.sku && <p className="text-xs text-charcoal/40">{p.sku}</p>}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-charcoal/60">{p.category ?? '—'}</td>
                  <td className="px-4 py-3 text-charcoal">{p.price.toFixed(2)} {t('ر.ق', 'QAR')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${p.quantity <= p.low_stock_threshold ? 'text-red-500' : 'text-charcoal'}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] tracking-widest uppercase px-2 py-1 ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(p)}
                        className="text-charcoal/40 hover:text-sand transition-colors">
                        <Pencil size={14} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                        className="text-charcoal/40 hover:text-red-500 transition-colors disabled:opacity-30">
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-sand/20 sticky top-0 bg-white">
              <h3 className="text-sm tracking-widest uppercase text-charcoal">
                {modal === 'create' ? t('منتج جديد', 'New Product') : t('تعديل المنتج', 'Edit Product')}
              </h3>
              <button onClick={() => setModal(null)} className="text-charcoal/40 hover:text-charcoal transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{t('الاسم *', 'Name *')}</label>
                <input value={form.name} onChange={F('name')} className="w-full border border-sand/30 px-3 py-2 text-sm focus:outline-none focus:border-charcoal" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{t('الرمز', 'SKU')}</label>
                <input value={form.sku ?? ''} onChange={F('sku')} className="w-full border border-sand/30 px-3 py-2 text-sm focus:outline-none focus:border-charcoal" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{t('الفئة', 'Category')}</label>
                <input value={form.category ?? ''} onChange={F('category')} className="w-full border border-sand/30 px-3 py-2 text-sm focus:outline-none focus:border-charcoal" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{t('السعر (ر.ق)', 'Price (QAR)')}</label>
                <input type="number" step="0.01" value={form.price} onChange={F('price')} className="w-full border border-sand/30 px-3 py-2 text-sm focus:outline-none focus:border-charcoal" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{t('سعر المقارنة', 'Compare At Price')}</label>
                <input type="number" step="0.01" value={form.compare_at_price ?? ''} onChange={F('compare_at_price')} className="w-full border border-sand/30 px-3 py-2 text-sm focus:outline-none focus:border-charcoal" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{t('الكمية', 'Quantity')}</label>
                <input type="number" value={form.quantity} onChange={F('quantity')} className="w-full border border-sand/30 px-3 py-2 text-sm focus:outline-none focus:border-charcoal" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{t('حد المخزون المنخفض', 'Low Stock Threshold')}</label>
                <input type="number" value={form.low_stock_threshold} onChange={F('low_stock_threshold')} className="w-full border border-sand/30 px-3 py-2 text-sm focus:outline-none focus:border-charcoal" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{t('الحالة', 'Status')}</label>
                <select value={form.status} onChange={F('status')} className="w-full border border-sand/30 px-3 py-2 text-sm focus:outline-none focus:border-charcoal bg-white">
                  <option value="active">{t('نشط', 'Active')}</option>
                  <option value="draft">{t('مسودة', 'Draft')}</option>
                  <option value="archived">{t('مؤرشف', 'Archived')}</option>
                </select>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <input type="checkbox" id="in_stock" checked={form.in_stock} onChange={F('in_stock')} className="w-4 h-4 accent-charcoal" />
                <label htmlFor="in_stock" className="text-xs tracking-widest uppercase text-charcoal/60 cursor-pointer">
                  {t('متوفر في المخزون', 'In Stock')}
                </label>
              </div>
              <div className="col-span-2">
                <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{t('صورة المنتج', 'Product Image')}</label>
                <ImageUpload value={form.image_url} onChange={url => setForm({ ...form, image_url: url })} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{t('الوصف', 'Description')}</label>
                <textarea rows={3} value={form.description ?? ''} onChange={F('description')} className="w-full border border-sand/30 px-3 py-2 text-sm focus:outline-none focus:border-charcoal resize-none" />
              </div>
              {error && <div className="col-span-2 text-red-500 text-xs">{error}</div>}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-sand/20 sticky bottom-0 bg-white">
              <button onClick={() => setModal(null)}
                className="text-xs tracking-widest uppercase border border-sand/40 px-5 py-2.5 text-charcoal hover:border-charcoal transition-colors">
                {t('إلغاء', 'Cancel')}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 text-xs tracking-widest uppercase bg-charcoal text-cream px-5 py-2.5 hover:bg-charcoal-light transition-colors disabled:opacity-50">
                {saving ? '...' : <Check size={14} />}
                {t('حفظ', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
