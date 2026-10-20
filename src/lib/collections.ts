export const COLLECTIONS = [
  {
    slug: 'specialty-coffee',
    ar: 'قهوة مختصة',
    en: 'Specialty Coffee',
    descriptionAr: 'مختارات من القهوة المختصة المحمصة بعناية لتجربة متوازنة وواضحة النكهات.',
    descriptionEn: 'Carefully roasted specialty coffee selected for a balanced, flavourful cup.',
    keywords: ['coffee', 'قهوة', 'espresso', 'filter', 'blend'],
  },
  {
    slug: 'coffee-beans',
    ar: 'حبوب القهوة',
    en: 'Coffee Beans',
    descriptionAr: 'حبوب قهوة طازجة بخيارات متنوعة تناسب الإسبريسو وطرق التقطير.',
    descriptionEn: 'Fresh coffee beans for espresso and a wide range of filter methods.',
    keywords: ['bean', 'beans', 'حبوب', 'coffee', 'قهوة'],
  },
  {
    slug: 'chocolate-by-weight',
    ar: 'شوكولاتة وزن',
    en: 'Chocolate by Weight',
    descriptionAr: 'تشكيلة شوكولاتة تُباع بالوزن للضيافة والهدايا واللحظات اليومية.',
    descriptionEn: 'Chocolate sold by weight for gifting, sharing, and everyday treats.',
    keywords: ['chocolate', 'شوكولاتة', 'شوكولاته', 'cocoa'],
  },
  {
    slug: 'dried-fruit',
    ar: 'فواكه مجففة',
    en: 'Dried Fruit',
    descriptionAr: 'فواكه مجففة مختارة بعناية، مناسبة للتقديم مع القهوة أو كوجبة خفيفة.',
    descriptionEn: 'Carefully selected dried fruit, ideal with coffee or as a wholesome snack.',
    keywords: ['dried fruit', 'fruit', 'فواكه', 'مجففة'],
  },
  {
    slug: 'oud-incense',
    ar: 'عود وبخور',
    en: 'Oud & Incense',
    descriptionAr: 'روائح عود وبخور تضيف لمسة دافئة وأصيلة للمكان.',
    descriptionEn: 'Warm, distinctive oud and incense fragrances for the home.',
    keywords: ['oud', 'incense', 'عود', 'بخور'],
  },
  {
    slug: 'boxed-chocolate',
    ar: 'شوكولاتة علب',
    en: 'Boxed Chocolate',
    descriptionAr: 'علب شوكولاتة أنيقة جاهزة للإهداء والمناسبات والضيافة.',
    descriptionEn: 'Elegant boxed chocolate for gifts, occasions, and hospitality.',
    keywords: ['boxed chocolate', 'chocolate box', 'شوكولاتة', 'شوكولاته', 'علب'],
  },
  {
    slug: 'bulk-packs',
    ar: 'عبوات كبيرة',
    en: 'Bulk Packs',
    descriptionAr: 'عبوات كبيرة وعملية للمنزل والمكتب والطلبات ذات الاستخدام المتكرر.',
    descriptionEn: 'Practical bulk packs for homes, offices, and frequent use.',
    keywords: ['bulk', '1kg', 'كيلو', 'large', 'عبوات'],
  },
] as const

export type Collection = (typeof COLLECTIONS)[number]

export function getCollection(slug: string) {
  return COLLECTIONS.find((collection) => collection.slug === slug)
}
