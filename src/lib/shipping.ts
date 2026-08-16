export type ShippingZone = 'doha' | 'qatar' | 'gcc'

export const SHIPPING_RATES: Record<ShippingZone, number> = {
  doha: 10,
  qatar: 15,
  gcc: 50,
}

export function getShippingCost(zone: ShippingZone | '') {
  return zone ? SHIPPING_RATES[zone] : null
}

export function shippingZoneLabel(zone: ShippingZone, lang: 'ar' | 'en') {
  const labels = {
    doha: { ar: 'داخل الدوحة', en: 'Inside Doha' },
    qatar: { ar: 'خارج الدوحة داخل قطر', en: 'Outside Doha, within Qatar' },
    gcc: { ar: 'دول مجلس التعاون', en: 'GCC countries' },
  }

  return labels[zone][lang]
}
