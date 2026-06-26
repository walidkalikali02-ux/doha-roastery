'use client'

export const ORIGIN_AR: Record<string, string> = {
  Brazil: 'برازيل',
  Colombia: 'كولومبيا',
  'El Salvador': 'السلفادور',
  Ethiopia: 'إثيوبيا',
  'Medium Roast': 'تحميص متوسط',
  'Dark Roast': 'تحميص غامق',
  'China Yunnan': 'يونان الصيني',
  'Fall in Love': 'فال إن لاف',
  Guatemala: 'غواتيمالا',
  Honduras: 'هندوراس',
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
  'Coffee Beans': 'حبوب القهوة',
  Capsules: 'الكبسولات',
  'Drip Pouches': 'أكياس الدريب',
  Tools: 'الأدوات',
  Matcha: 'ماتشا',
  Tea: 'الشاي',
  'Turkish Coffee': 'القهوة التركية',
  'Qatari Coffee': 'القهوة القطرية',
}

export function getBrandName(lang: 'ar' | 'en') {
  return lang === 'ar' ? 'دوحة روستري' : 'Doha Roastery'
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
      .trim()
  }

  return QTY_AR[weight] ?? weight
}
