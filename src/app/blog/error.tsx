'use client'
export default function BlogError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-xl px-6 py-36 text-center"><h1 className="text-2xl">تعذر تحميل المجلة / Could not load the journal</h1><p className="mt-4 text-charcoal/70">يرجى المحاولة مجددًا. / Please try again.</p><button onClick={reset} className="mt-6 bg-charcoal px-6 py-3 text-cream">إعادة المحاولة / Retry</button></main>
}
