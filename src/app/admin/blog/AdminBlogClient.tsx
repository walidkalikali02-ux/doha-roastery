'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Plus, Search, ArrowLeft, Eye, Save, Trash2, Download, Loader } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { adminFetch } from '@/lib/admin-fetch'
import { BLOG_CATEGORIES, BLOG_LABELS, blogHref, type BlogInput, type BlogLang, type BlogPost } from '@/lib/blog-types'
import { BlogPostInput } from '@/lib/blog-input'
import BlogBody from '@/components/BlogBody'
import ImageUpload from '@/components/ImageUpload'

const EMPTY: BlogInput = {
  slug: '', title_ar: '', title_en: '', excerpt_ar: '', excerpt_en: '', content_ar: '', content_en: '',
  category: 'guides', image_url: '/blog/coffee-journey.svg', image_alt_ar: 'رسم توضيحي لرحلة القهوة من الثمرة إلى الفنجان', image_alt_en: 'Editorial illustration of coffee from cherry to cup',
  seo_title_ar: '', seo_title_en: '', seo_description_ar: '', seo_description_en: '', sources: [], status: 'draft',
}
const COVERS = [
  { path: 'coffee-journey', ar: 'من الثمرة إلى الفنجان', en: 'Cherry to cup' },
  { path: 'coffee-species', ar: 'حبوب القهوة', en: 'Coffee beans' },
  { path: 'coffee-robusta', ar: 'روبوستا', en: 'Robusta' },
  { path: 'coffee-branch', ar: 'غصن القهوة', en: 'Coffee branch' },
  { path: 'coffee-origins', ar: 'بلدان المنشأ', en: 'Growing origins' },
]
function toInput(post: BlogPost): BlogInput {
  return Object.fromEntries(Object.keys(EMPTY).map((key) => [key, post[key as keyof BlogInput]])) as BlogInput
}
export default function AdminBlogClient({ starterCount }: { starterCount: number }) {
  const { t, lang } = useLang()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<BlogPost | 'new' | null>(null)
  const [form, setForm] = useState<BlogInput>(EMPTY)
  const [editorLang, setEditorLang] = useState<BlogLang>('ar')
  const [preview, setPreview] = useState(false)
  const [sourcesText, setSourcesText] = useState('')
  const [busy, setBusy] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminFetch('/api/admin/blog')
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      setPosts(json.data)
      setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load articles') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function change<K extends keyof BlogInput>(key: K, value: BlogInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }
  function open(post?: BlogPost) {
    if (dirty && !window.confirm(t('تجاهل التغييرات غير المحفوظة؟', 'Discard unsaved changes?'))) return
    setEditing(post ?? 'new')
    setForm(post ? toInput(post) : { ...EMPTY })
    setSourcesText(post?.sources.map((source) => `${source.label} | ${source.url}`).join('\n') ?? '')
    setPreview(false); setDirty(false); setError(null); setNotice(null); setFieldErrors([])
  }
  function close() {
    if (dirty && !window.confirm(t('تجاهل التغييرات غير المحفوظة؟', 'Discard unsaved changes?'))) return
    setEditing(null); setDirty(false); setError(null); setFieldErrors([])
  }
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (busy || imageBusy) return
    setError(null); setNotice(null); setFieldErrors([])
    const sources = sourcesText.split('\n').filter((line) => line.trim()).map((line) => {
      const separator = line.indexOf('|')
      return { label: separator < 0 ? '' : line.slice(0, separator).trim(), url: separator < 0 ? '' : line.slice(separator + 1).trim() }
    })
    const parsed = BlogPostInput.safeParse({ ...form, sources })
    if (!parsed.success) {
      setError(t('راجع الحقول المطلوبة في اللغتين والصورة والمصادر قبل الحفظ.', 'Check required fields in both languages, the image, and sources before saving.'))
      setFieldErrors([...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))])
      return
    }
    setBusy(true)
    try {
      const current = editing && editing !== 'new' ? editing : null
      const response = await adminFetch('/api/admin/blog', { method: current ? 'PATCH' : 'POST', body: JSON.stringify(current ? { id: current.id, expectedUpdatedAt: current.updated_at, post: parsed.data } : parsed.data) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      setPosts((prev) => [json.data, ...prev.filter((post) => post.id !== json.data.id)])
      setEditing(json.data); setForm(toInput(json.data)); setDirty(false)
      setNotice(parsed.data.status === 'published' ? t('تم نشر المقال وتحديث المجلة وخريطة الموقع.', 'Article published. Journal and sitemap updated.') : t('تم حفظ المسودة. لا تظهر للزوار.', 'Draft saved. It is not visible to visitors.'))
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save article') }
    finally { setBusy(false) }
  }
  async function remove(post: BlogPost) {
    setBusy(true); setError(null); setNotice(null)
    try {
      const response = await adminFetch('/api/admin/blog', { method: 'DELETE', body: JSON.stringify({ id: post.id, expectedUpdatedAt: post.updated_at }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      setPosts((prev) => prev.filter((item) => item.id !== post.id)); setDeleteId(null)
      setNotice(t('تم حذف المقال.', 'Article deleted.'))
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete article') }
    finally { setBusy(false) }
  }
  async function importArticles() {
    setBusy(true); setError(null); setNotice(null)
    try {
      const response = await adminFetch('/api/admin/blog/import', { method: 'POST' })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      await load()
      setNotice(t(`تمت إضافة ${json.imported} من المقالات. حُفظت المقالات الموجودة دون تغيير.`, `${json.imported} articles added. Existing articles were preserved.`))
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not import articles') }
    finally { setBusy(false) }
  }
  const inputStyle = 'w-full border border-sand/40 bg-white px-3 py-2.5 text-sm outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta disabled:bg-cream-dark disabled:text-charcoal/50'
  const localizedField = (key: 'title' | 'excerpt' | 'content' | 'image_alt' | 'seo_title' | 'seo_description', label: string, multiline = false, rows = 3) => {
    const field = `${key}_${editorLang}` as keyof BlogInput
    const value = form[field] as string
    const id = `blog-${field}`
    return <div><label htmlFor={id} className="mb-2 block text-sm font-medium">{label} <span className="text-xs font-normal text-charcoal/50">({editorLang === 'ar' ? 'العربية' : 'English'})</span></label>{multiline ? <textarea id={id} dir={editorLang === 'ar' ? 'rtl' : 'ltr'} rows={rows} value={value} aria-invalid={fieldErrors.includes(field)} onChange={(e) => change(field, e.target.value)} className={inputStyle} /> : <input id={id} dir={editorLang === 'ar' ? 'rtl' : 'ltr'} value={value} aria-invalid={fieldErrors.includes(field)} onChange={(e) => change(field, e.target.value)} className={inputStyle} />}</div>
  }

  return <div className="max-w-7xl">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 text-xs tracking-widest text-terracotta">DOHA ROASTERY JOURNAL</p><h2 className="text-3xl font-light">{t('إدارة المدونة', 'Blog management')}</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-charcoal/60">{t('أنشئ محتوى مفيدًا باللغتين. راجع الصور وبيانات البحث، ثم انشر عندما يصبح المقال جاهزًا.', 'Create useful stories in Arabic and English. Review images and search details, then publish when your article is ready.')}</p></div>
      <div className="flex flex-wrap gap-3"><Link href="/blog" target="_blank" className="inline-flex min-h-11 items-center gap-2 border border-sand/40 px-4 text-sm"><BookOpen size={16} />{t('عرض المجلة', 'View journal')}</Link>{!editing && <button onClick={() => open()} className="inline-flex min-h-11 items-center gap-2 bg-charcoal px-4 text-sm text-cream"><Plus size={16} />{t('مقال جديد', 'New article')}</button>}</div>
    </div>
    {error && <div role="alert" className="mb-5 border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">{error}{fieldErrors.length > 0 && <p className="mt-2" dir="ltr">{fieldErrors.join(', ')}</p>}<button onClick={() => void load()} className="ms-3 underline">{t('إعادة التحميل', 'Reload')}</button></div>}
    {notice && <p role="status" className="mb-5 border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
    {editing ? <form onSubmit={save} noValidate>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-y border-sand/30 py-4">
        <button type="button" onClick={close} disabled={busy} className="inline-flex min-h-11 items-center gap-2 text-sm disabled:opacity-50"><ArrowLeft size={16} />{t('كل المقالات', 'All articles')}</button>
        <div className="flex flex-wrap items-center gap-3"><span className="text-xs text-charcoal/60">{dirty ? t('تغييرات غير محفوظة', 'Unsaved changes') : t('لا توجد تغييرات غير محفوظة', 'No unsaved changes')}</span><button type="button" onClick={() => setPreview(!preview)} className="inline-flex min-h-11 items-center gap-2 border border-sand/40 px-4 text-sm"><Eye size={16} />{preview ? t('تحرير', 'Edit') : t('معاينة', 'Preview')}</button><button disabled={busy || imageBusy} className="inline-flex min-h-11 items-center gap-2 bg-charcoal px-5 text-sm text-cream disabled:opacity-50">{busy ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}{form.status === 'published' ? t('حفظ ونشر', 'Save & publish') : t('حفظ المسودة', 'Save draft')}</button></div>
      </div>
      <div className="mb-6 flex gap-2" role="group" aria-label={t('لغة المقال', 'Article language')}>{(['ar', 'en'] as const).map((value) => <button type="button" key={value} onClick={() => setEditorLang(value)} aria-pressed={editorLang === value} className={`min-h-11 border px-5 text-sm ${editorLang === value ? 'border-charcoal bg-charcoal text-cream' : 'border-sand/40'}`}>{value === 'ar' ? 'العربية' : 'English'}</button>)}</div>
      {preview ? <article dir={editorLang === 'ar' ? 'rtl' : 'ltr'} lang={editorLang} className="mx-auto max-w-3xl border border-sand/30 bg-white p-5 sm:p-10"><p className="mb-5 text-xs text-terracotta">{t('معاينة غير منشورة', 'Unpublished preview')}</p><h2 className="text-3xl font-medium leading-relaxed">{form[`title_${editorLang}`] || t('عنوان المقال', 'Article title')}</h2><p className="my-6 leading-relaxed text-charcoal/65">{form[`excerpt_${editorLang}`]}</p><div className="relative mb-8 aspect-[3/2] bg-cream-dark">{form.image_url && <Image src={form.image_url} alt={form[`image_alt_${editorLang}`]} fill unoptimized sizes="740px" className="object-cover" />}</div><BlogBody content={form[`content_${editorLang}`]} /></article> : <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-7 border border-sand/30 bg-white p-5 sm:p-7">
          {localizedField('title', t('العنوان *', 'Title *'))}
          {localizedField('excerpt', t('المقدمة المختصرة *', 'Excerpt *'), true)}
          <div>{localizedField('content', t('نص المقال *', 'Article body *'), true, 18)}<p className="mt-2 text-xs leading-relaxed text-charcoal/55">{t('استخدم ## في بداية سطر العنوان الفرعي، وسطرًا فارغًا بين الفقرات، و- للقوائم. لا يُعرض HTML.', 'Use ## for section headings, blank lines between paragraphs, and - for lists. HTML is displayed as text.')}</p></div>
          <details className="border-t border-sand/30 pt-5" open><summary className="cursor-pointer text-sm font-medium">{t('ظهور المقال في البحث', 'Search appearance')}</summary><div className="mt-5 space-y-5">{localizedField('seo_title', t('عنوان البحث (اختياري)', 'SEO title (optional)'))}{localizedField('seo_description', t('وصف البحث (اختياري)', 'SEO description (optional)'), true)}<p className="text-xs leading-relaxed text-charcoal/55">{t('عند تركها فارغة يُستخدم عنوان المقال ومقدمته. اجعل العنوان واضحًا والوصف موجزًا دون حشو كلمات مفتاحية.', 'Leave blank to use the article title and excerpt. Write a descriptive title and a concise summary, without keyword stuffing.')}</p><div className="border border-sand/30 bg-cream p-4"><p className="text-xs text-charcoal/60" dir="ltr">doharoastery.com/blog/{form.slug || 'your-article'}</p><p className="mt-2 text-lg text-[#38543e]">{form[`seo_title_${editorLang}`] || form[`title_${editorLang}`] || t('عنوان المقال', 'Article title')}</p><p className="mt-2 text-sm leading-relaxed text-charcoal/65">{form[`seo_description_${editorLang}`] || form[`excerpt_${editorLang}`]}</p></div></div></details>
        </div>
        <aside className="space-y-6">
          <section className="space-y-5 border border-sand/30 bg-white p-5"><h3 className="text-sm font-semibold">{t('النشر والتنظيم', 'Publication & organisation')}</h3><div><label htmlFor="blog-status" className="mb-2 block text-sm">{t('الحالة', 'Status')}</label><select id="blog-status" value={form.status} onChange={(e) => change('status', e.target.value as BlogInput['status'])} className={inputStyle}><option value="draft">{t('مسودة', 'Draft')}</option><option value="published">{t('منشور', 'Published')}</option></select><p className="mt-2 text-xs leading-relaxed text-charcoal/60">{t('المسودات مخفية عن الزوار ومحركات البحث. النشر يتم عند الحفظ.', 'Drafts are hidden from visitors and search engines. Publication takes effect when you save.')}</p></div><div><label htmlFor="blog-category" className="mb-2 block text-sm">{t('التصنيف', 'Category')}</label><select id="blog-category" value={form.category} onChange={(e) => change('category', e.target.value as BlogInput['category'])} className={inputStyle}>{BLOG_CATEGORIES.map((value) => <option key={value} value={value}>{BLOG_LABELS[value][lang]}</option>)}</select></div><div><label htmlFor="blog-slug" className="mb-2 block text-sm">{t('رابط المقال *', 'URL slug *')}</label><input id="blog-slug" value={form.slug} disabled={editing !== 'new' && Boolean(editing.published_at)} onChange={(e) => change('slug', e.target.value)} dir="ltr" className={inputStyle} placeholder="arabica-coffee" /><p className="mt-2 text-xs leading-relaxed text-charcoal/55">{t('حروف إنجليزية صغيرة وأرقام وشرطات. يثبت الرابط بعد أول نشر لحماية الروابط.', 'Lowercase letters, numbers, and hyphens. The URL is locked after first publication to preserve links.')}</p></div>{editing !== 'new' && editing.status === 'published' && <Link href={blogHref(editing.slug, editorLang)} target="_blank" className="inline-block border-b border-sand text-sm">{t('فتح المقال المنشور', 'Open published article')}</Link>}</section>
          <section className="space-y-5 border border-sand/30 bg-white p-5"><h3 className="text-sm font-semibold">{t('صورة الغلاف', 'Cover image')}</h3><ImageUpload key={editing === 'new' ? 'new' : editing.id} value={form.image_url} onChange={(url) => change('image_url', url)} onBusyChange={setImageBusy} /><div><label htmlFor="blog-image-url" className="mb-2 block text-sm">{t('أو رابط صورة HTTPS', 'Or an HTTPS image URL')}</label><input id="blog-image-url" value={form.image_url} onChange={(e) => change('image_url', e.target.value)} dir="ltr" className={inputStyle} /></div><div><label htmlFor="blog-cover" className="mb-2 block text-sm">{t('الرسوم الأصلية', 'Original illustrations')}</label><select id="blog-cover" value={COVERS.some((cover) => form.image_url === `/blog/${cover.path}.svg`) ? form.image_url : ''} onChange={(e) => { if (e.target.value) change('image_url', e.target.value) }} className={inputStyle}><option value="">{t('صورة مخصصة', 'Custom image')}</option>{COVERS.map((cover) => <option key={cover.path} value={`/blog/${cover.path}.svg`}>{cover[lang]}</option>)}</select></div>{localizedField('image_alt', t('وصف الصورة *', 'Image description *'))}<p className="text-xs leading-relaxed text-charcoal/55">{t('صف ما يظهر فعليًا في الصورة، وراجع الوصف في اللغتين عند تغييرها.', 'Describe what the image actually shows. Update both language descriptions when replacing it.')}</p></section>
          <section className="border border-sand/30 bg-white p-5"><label htmlFor="blog-sources" className="mb-3 block text-sm font-semibold">{t('المصادر', 'Sources')}</label><textarea id="blog-sources" value={sourcesText} onChange={(e) => { setSourcesText(e.target.value); setDirty(true) }} dir="ltr" rows={5} className={inputStyle} placeholder="Source name | https://example.com" /><p className="mt-2 text-xs leading-relaxed text-charcoal/55">{t('مصدر واحد في كل سطر: الاسم | رابط HTTPS', 'One source per line: name | HTTPS URL')}</p></section>
        </aside>
      </div>}
    </form> : <>
      <div className="mb-7 flex flex-col justify-between gap-4 border border-sand/30 bg-white p-5 sm:flex-row sm:items-center"><div><h3 className="text-sm font-medium">{t('مكتبة البداية', 'Starter library')}</h3><p className="mt-2 text-xs leading-relaxed text-charcoal/60">{t(`${starterCount} مقالًا باللغتين مع رسوم أصلية ومصادر. الاستيراد لا يغير المقالات الموجودة.`, `${starterCount} bilingual articles with original illustrations and sources. Importing preserves existing articles.`)}</p></div><button onClick={() => void importArticles()} disabled={busy || loading} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-sand/50 px-4 text-sm disabled:opacity-50"><Download size={16} />{t('استيراد المقالات', 'Import starter articles')}</button></div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative sm:w-80"><Search size={16} className="absolute start-3 top-3.5 text-charcoal/50" /><label htmlFor="admin-blog-search" className="sr-only">{t('ابحث عن مقال', 'Search articles')}</label><input id="admin-blog-search" value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputStyle} ps-10`} placeholder={t('ابحث بالعنوان أو الرابط…', 'Search title or URL…')} /></div><div className="flex flex-wrap gap-2">{['all', 'published', 'draft'].map((value) => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={`min-h-11 border px-4 text-xs ${filter === value ? 'border-charcoal bg-charcoal text-cream' : 'border-sand/40'}`}>{value === 'all' ? t('الكل', 'All') : value === 'published' ? t('منشور', 'Published') : t('مسودة', 'Draft')} ({posts.filter((post) => value === 'all' || post.status === value).length})</button>)}</div></div>
      {loading ? <p role="status" className="py-16 text-center text-sm text-charcoal/60">{t('جارٍ تحميل المقالات…', 'Loading articles…')}</p> : posts.length === 0 ? <div className="border-y border-sand/30 py-16 text-center"><BookOpen size={28} className="mx-auto text-sand-dark" /><h3 className="mt-4 text-xl">{t('تبدأ المجلة بمقال مفيد', 'A useful story starts your journal')}</h3><p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-charcoal/60">{t('استورد مكتبة البداية، أو أنشئ مقالك الأول واحفظه كمسودة قبل النشر.', 'Import the starter library or create your first article and save a draft before publishing.')}</p></div> : <div className="divide-y divide-sand/30 border-y border-sand/30">{posts.filter((post) => (filter === 'all' || post.status === filter) && `${post.title_ar} ${post.title_en} ${post.slug}`.toLowerCase().includes(query.toLowerCase())).map((post) => <article key={post.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center"><div className="relative aspect-[3/2] w-28 shrink-0 bg-cream-dark"><Image src={post.image_url} alt="" fill unoptimized sizes="112px" className="object-cover" /></div><div className="min-w-0 flex-1"><p className="text-xs text-terracotta">{BLOG_LABELS[post.category][lang]} · {post.status === 'published' ? t('منشور', 'Published') : t('مسودة', 'Draft')}</p><h3 className="mt-2 text-lg font-medium leading-relaxed">{post[`title_${lang}`]}</h3><p className="mt-1 break-all text-xs text-charcoal/50" dir="ltr">/blog/{post.slug}</p></div><div className="flex shrink-0 flex-wrap items-center gap-3">{post.status === 'published' && <Link href={blogHref(post.slug, lang)} target="_blank" className="min-h-11 content-center border border-sand/40 px-3 text-sm">{t('عرض', 'View')}</Link>}<button onClick={() => open(post)} className="min-h-11 border border-sand/40 px-3 text-sm" aria-label={`${t('تحرير', 'Edit')} ${post[`title_${lang}`]}`}>{t('تحرير', 'Edit')}</button>{deleteId === post.id ? <div className="flex items-center gap-2"><span className="text-xs text-red-700">{t('حذف نهائي؟', 'Delete permanently?')}</span><button disabled={busy} onClick={() => void remove(post)} className="min-h-11 px-2 text-sm text-red-700">{t('حذف', 'Delete')}</button><button disabled={busy} onClick={() => setDeleteId(null)} className="min-h-11 px-2 text-sm">{t('إلغاء', 'Cancel')}</button></div> : <button onClick={() => setDeleteId(post.id)} className="min-h-11 px-3 text-charcoal/55 hover:text-red-700" aria-label={`${t('حذف', 'Delete')} ${post[`title_${lang}`]}`}><Trash2 size={16} /></button>}</div></article>)}</div>}
    </>}
  </div>
}
