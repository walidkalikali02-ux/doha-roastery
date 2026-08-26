export const ORIGIN_AR: Record<string, string> = {
  Brazil: 'البرازيل',
  Colombia: 'كولومبيا',
  'El Salvador': 'السلفادور',
  Ethiopia: 'إثيوبيا',
  'Medium Roast': 'تحميص متوسط',
  'Dark Roast': 'تحميص غامق',
  'China Yunnan': 'يونان الصينية',
  'Fall in Love': 'فال إن لاف',
  Guatemala: 'غواتيمالا',
  Honduras: 'هندوراس',
}

export const DELIVERY_WINDOW_AR = 'خلال ١–٢ يوم'
export const DELIVERY_WINDOW_EN = '1–2 days'

// Customer-facing order number. Legacy orders store "DR-<uuid>" — strip the
// prefix so we always render a short, clean identifier. New orders already
// arrive as short sequential numbers ("1001", "1002", ...).
export function formatOrderNumber(order: { order_number: string | null; id: string }) {
  const raw = (order.order_number ?? '').trim()
  if (!raw) return `#${order.id.slice(0, 8)}`
  const cleaned = raw.startsWith('DR-') ? raw.slice(3, 11) : raw
  return `#${cleaned}`
}

export function toArabicDigits(value: number | string) {
  return String(value).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)])
}

export const QTY_AR: Record<string, string> = {
  '1 Box': 'علبة واحدة',
  '5 Boxes': '٥ علب',
  'Single Serve': 'ظرف واحد',
  '5 Bags': '٥ أظرف',
  '10 Bags': '١٠ أظرف',
  'Box of 8': 'علبة ٨ أكياس',
}

const CATEGORY_AR: Record<string, string> = {
  Coffee: 'القهوة',
  'Coffee Beans': 'حبوب القهوة',
  'Coffee Capsules': 'كبسولات القهوة',
  'single-origin': 'قهوة أحادية المصدر',
  blend: 'خلطات القهوة',
  decaf: 'قهوة منزوعة الكافيين',
  espresso: 'قهوة الإسبريسو',
  Capsules: 'الكبسولات',
  'Drip Pouches': 'أكياس الدريب',
  Tools: 'أدوات القهوة',
  tools: 'أدوات القهوة',
  Matcha: 'ماتشا',
  Tea: 'الشاي',
  Honey: 'العسل',
  'Turkish Coffee': 'القهوة التركية',
  'Qatari Coffee': 'القهوة القطرية',
}

export function getBrandName(lang: 'ar' | 'en') {
  return lang === 'ar' ? 'دوحة روستري' : 'Doha Roastery'
}

export function localizeOrigin(origin: string | null | undefined, lang: 'ar' | 'en') {
  if (!origin) return ''
  return lang === 'ar' ? (ORIGIN_AR[origin] ?? origin) : origin
}

export function localizeCategory(category: string | null | undefined, lang: 'ar' | 'en') {
  if (!category) return ''
  return lang === 'ar' ? (CATEGORY_AR[category] ?? category) : category
}

export function localizeWeight(weight: string | null | undefined, lang: 'ar' | 'en') {
  if (!weight) return ''
  if (lang !== 'ar') return weight

  if (weight.includes('|')) {
    const [origin, qty] = weight.split('|')
    return `${ORIGIN_AR[origin] ?? origin} | ${QTY_AR[qty] ?? qty}`
  }

  if (/^\d+(g|kg)$/i.test(weight)) {
    return weight
      .replace(/kg/i, ' كغ')
      .replace(/g/i, ' غ')
      .replace(/^\d+/, toArabicDigits)
      .trim()
  }

  return QTY_AR[weight] ?? weight
}

export function formatProductTitle({
  name,
  nameAr,
  weight,
  lang,
}: {
  name: string
  nameAr?: string | null
  weight?: string | null
  lang: 'ar' | 'en'
}) {
  const baseName = lang === 'ar' && nameAr ? nameAr : name
  if (!weight) return baseName

  if (weight.includes('|')) {
    const origin = weight.split('|')[0]
    const originLabel = localizeOrigin(origin, lang)
    return `${baseName} — ${originLabel}`
  }

  return `${baseName} — ${localizeWeight(weight, lang)}`
}

export function formatGroupedProductTitle({
  baseName,
  baseNameAr,
  origin,
  lang,
}: {
  baseName: string
  baseNameAr?: string | null
  origin?: string | null
  lang: 'ar' | 'en'
}) {
  const baseTitle = lang === 'ar' && baseNameAr ? baseNameAr : baseName
  if (!origin) return baseTitle
  return `${baseTitle} — ${localizeOrigin(origin, lang)}`
}

export function normalizeArabicDescription(description: string, weight?: string | null) {
  let normalized = description.trim()
  if (weight?.includes('10 Bags')) normalized = normalized.replace(/\b٨\b/g, '١٠')
  if (weight?.includes('5 Bags')) normalized = normalized.replace(/\b٨\b/g, '٥')
  return normalized
}

export function buildProductDescription({
  name,
  nameAr,
  category,
  weight,
  sourceDescription,
  baseDescription,
  lang,
}: {
  name: string
  nameAr?: string | null
  category?: string | null
  weight?: string | null
  sourceDescription?: string | null
  baseDescription?: string | null
  lang: 'ar' | 'en'
}) {
  const title = formatProductTitle({ name, nameAr, weight, lang })
  const categoryLabel = localizeCategory(category ?? '', lang)
  const categoryKey = (category ?? '').toLowerCase()
  const isTool = categoryKey.includes('tool') || categoryKey.includes('accessor')
  const source = sourceDescription?.trim()
  const base = baseDescription?.trim()

  if (lang === 'ar') {
    if (!base && source?.includes('5 bags pack') && categoryKey.includes('drip')) {
      const origin = weight?.split('|')[0] ?? ''
      const originLabel = localizeOrigin(origin, 'ar')
      const flavor = source.includes('Smooth earthy')
        ? 'بنكهة ترابية ناعمة'
        : source.includes('Bright caramel')
          ? 'بنكهة كراميل مشرقة'
          : 'مناسب للمكتب والسفر والإهداء'
      const blend = source.includes('Fall in Love') ? 'خلطة فال إن لاف المميزة' : `قهوة ${originLabel}`
      return `علبة تحتوي على ٥ أكياس قهوة دريب ${blend} للحصة الواحدة. ${flavor}. محمصة طازجة في دوحة روستري، قطر.`
    }

    if (!base && source?.includes('Ethiopia Coffee') && source.includes('Yirgacheffe')) {
      return 'قهوة إثيوبيا يِرغاشيف أحادية المصدر، من مزارع صغيرة متنوعة في منطقة يِرغاشيف. من صنف هيرلوم، نمت على ارتفاع يتراوح بين ١٨٠٠ و٢٢٠٠ متر، وعولجت بالطريقة الطبيعية. يقدم الفنجان نكهات الشوكولاتة الداكنة والتوت الداكن والتفاح، وحصلت القهوة على تقييم ٨٩. تفاصيل القهوة: المنشأ إثيوبيا، المنطقة يِرغاشيف، الصنف هيرلوم، الارتفاع ١٨٠٠–٢٢٠٠ متر، والمعالجة طبيعية.'
    }

    const detail = isTool
      ? `صُمم ${title} لمساعدة محبي القهوة على تحضير فنجان أفضل في المنزل أو المكتب. يتيح استخدامه تطوير روتين واضح ومنظم، مع التحكم في الخطوات بما يناسب مستوى الخبرة وطريقة التحضير المفضلة. إنه اختيار عملي لركن القهوة ولمن يرغب في إضافة أداة موثوقة إلى تجهيزاته اليومية. احفظه واستخدمه وفق تعليمات الشركة للحفاظ على جودته، واستمتع بتحضير القهوة بعناية مع توصيل داخل قطر.`
      : `${title} من فئة ${categoryLabel || 'القهوة المختصة'}، ومناسب لمحبي القهوة الذين يبحثون عن منتج واضح وسهل الإضافة إلى روتينهم اليومي. يساعد الاسم والحجم والمنشأ المتاح في اختيار الكمية المناسبة للمنزل أو المكتب أو الضيافة. استمتع به بالطريقة التي تفضلها، واحفظه بعناية للحفاظ على جودته ونكهته. يُجهّز للطلب بعناية من دوحة روستري مع توصيل داخل قطر.`
    return base ? `${base}\n\n${detail}` : detail
  }

  const detail = isTool
    ? `${title} is a practical coffee tool for people who want a more considered brewing routine at home, in the office, or while travelling. It helps make the preparation process more organized and gives coffee drinkers room to refine their method as their experience grows. Add it to a home coffee station or use it as a dependable part of your daily setup. Follow the manufacturer guidance for care and storage, and order it from Doha Roastery with delivery across Qatar.`
    : `${title} is part of the specialty coffee collection at Doha Roastery and is suited to customers who want a clear, practical choice for their daily coffee routine. The available name, category, size, origin, or pack information helps you choose the right product for home brewing, office use, or serving guests. Enjoy it in the way you prefer and store it carefully to help preserve its quality. Prepared for online ordering with delivery across Qatar.`
  return source ? `${source}\n\n${detail}` : detail
}
