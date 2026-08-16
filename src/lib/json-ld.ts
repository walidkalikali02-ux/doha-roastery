// Escape characters that would let attacker-controlled fields break out of
// a <script type="application/ld+json"> block.
const LINE_SEPARATORS = new RegExp('[\\u2028\\u2029]', 'g')

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATORS, (c) => c.charCodeAt(0) === 0x2028 ? '\\u2028' : '\\u2029')
}
