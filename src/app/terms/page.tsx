'use client'
import { useLang } from '@/contexts/LanguageContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function TermsPage() {
  const { t, dir } = useLang()

  const sections = [
    {
      id: 'acceptance',
      title: t('١. قبول الشروط', '1. Acceptance of Terms'),
      content: t(
        'باستخدامك لموقع دوحة روستري أو إجراء أي عملية شراء، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يُرجى عدم استخدام خدماتنا.',
        'By using the Doha Roastery website or making any purchase, you agree to be bound by these Terms and Conditions. If you do not agree to any part of these terms, please do not use our services.'
      ),
    },
    {
      id: 'products',
      title: t('٢. المنتجات والأسعار', '2. Products & Pricing'),
      content: t(
        'جميع الأسعار معروضة بالريال القطري (ر.ق) وتشمل ضريبة القيمة المضافة حيثما ينطبق. نحتفظ بحق تعديل الأسعار أو توقف المنتجات في أي وقت دون إشعار مسبق. تُعدّ الصور والأوصاف على الموقع تقريبية وقد تختلف قليلاً عن المنتج الفعلي.',
        'All prices are displayed in Qatari Riyals (QAR) and include VAT where applicable. We reserve the right to modify prices or discontinue products at any time without prior notice. Images and descriptions on the site are approximate and may slightly differ from the actual product.'
      ),
    },
    {
      id: 'orders',
      title: t('٣. الطلبات والدفع', '3. Orders & Payment'),
      content: t(
        'يُعتبر طلبك مؤكداً بعد استلامك رسالة التأكيد. نحتفظ بحق رفض أو إلغاء أي طلب في حالة وجود خطأ في السعر أو عدم توفر المنتج أو شبهة احتيال. يجب أن تكون جميع معلومات الدفع صحيحة وكاملة.',
        'Your order is confirmed upon receiving a confirmation message. We reserve the right to refuse or cancel any order in cases of pricing errors, product unavailability, or suspected fraud. All payment information must be accurate and complete.'
      ),
    },
    {
      id: 'shipping',
      title: t('٤. الشحن والتوصيل', '4. Shipping & Delivery'),
      content: t(
        'نوصّل داخل قطر خلال 2-4 أيام عمل. الشحن مجاني للطلبات التي تبلغ 200 ر.ق أو أكثر. لا نتحمل مسؤولية التأخيرات الناجمة عن عوامل خارج نطاق سيطرتنا كالظروف الجوية أو التأخيرات الجمركية. تتم عمليات التوصيل من السبت إلى الخميس خلال ساعات العمل.',
        'We deliver within Qatar within 2-4 business days. Free shipping on orders of 200 QAR or more. We are not responsible for delays caused by factors beyond our control such as weather conditions or customs delays. Deliveries are made Saturday to Thursday during business hours.'
      ),
    },
    {
      id: 'returns',
      title: t('٥. سياسة الإرجاع والاستبدال', '5. Returns & Refunds'),
      content: t(
        'يمكن إرجاع المنتجات غير المفتوحة خلال 7 أيام من تاريخ الاستلام. لا يمكن إرجاع منتجات القهوة المطحونة أو المفتوحة لأسباب صحية وسلامة غذائية. في حالة وجود عيب في المنتج أو خطأ في الطلب من جانبنا، سنتحمل تكاليف الإرجاع ونعيد المبلغ كاملاً أو نستبدل المنتج.',
        'Unopened products may be returned within 7 days of receipt. Ground or opened coffee products cannot be returned for health and food safety reasons. In the case of a product defect or an error on our part, we will cover return costs and provide a full refund or replacement.'
      ),
    },
    {
      id: 'privacy',
      title: t('٦. الخصوصية وحماية البيانات', '6. Privacy & Data Protection'),
      content: t(
        'نلتزم بحماية خصوصيتك. نجمع فقط المعلومات الضرورية لتنفيذ طلبك وتحسين تجربتك. لن نشارك بياناتك الشخصية مع أطراف ثالثة دون موافقتك، باستثناء الحالات المطلوبة قانونياً أو الضرورية لإتمام عملية الشراء (مثل شركات الشحن).',
        'We are committed to protecting your privacy. We only collect information necessary to process your order and improve your experience. We will not share your personal data with third parties without your consent, except as required by law or necessary to complete your purchase (such as shipping companies).'
      ),
    },
    {
      id: 'intellectual',
      title: t('٧. الملكية الفكرية', '7. Intellectual Property'),
      content: t(
        'جميع المحتويات على هذا الموقع، بما في ذلك الشعارات والصور والنصوص والتصاميم، هي ملك حصري لدوحة روستري. يُحظر نسخ أو استخدام أي محتوى دون إذن كتابي مسبق.',
        'All content on this website, including logos, images, text, and designs, is the exclusive property of Doha Roastery. Copying or using any content without prior written permission is strictly prohibited.'
      ),
    },
    {
      id: 'wholesale',
      title: t('٨. شروط الجملة', '8. Wholesale Terms'),
      content: t(
        'تخضع اتفاقيات التوريد بالجملة لعقود منفصلة. الأسعار والكميات الدنيا والشروط المتفق عليها في عقد الجملة تسري بدلاً من الشروط العامة. نحتفظ بحق تعليق أو إنهاء اتفاقيات الجملة في حال إخلال الطرف الآخر بالشروط المتفق عليها.',
        'Wholesale supply agreements are subject to separate contracts. Prices, minimum quantities, and terms agreed upon in the wholesale contract supersede these general terms. We reserve the right to suspend or terminate wholesale agreements if the other party breaches agreed terms.'
      ),
    },
    {
      id: 'liability',
      title: t('٩. تحديد المسؤولية', '9. Limitation of Liability'),
      content: t(
        'لا تتجاوز مسؤوليتنا في أي حال قيمة الطلب المعني. لسنا مسؤولين عن أي أضرار غير مباشرة أو تبعية. تسري هذه الشروط وفق أحكام قوانين دولة قطر.',
        'Our liability shall not exceed the value of the relevant order under any circumstances. We are not responsible for any indirect or consequential damages. These terms are governed by the laws of the State of Qatar.'
      ),
    },
    {
      id: 'changes',
      title: t('١٠. تعديل الشروط', '10. Changes to Terms'),
      content: t(
        'نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على الموقع. استمرارك في استخدام الخدمة بعد نشر التعديلات يعني قبولك لها.',
        'We reserve the right to modify these terms at any time. You will be notified of any material changes via email or a notice on the website. Your continued use of the service after changes are posted constitutes your acceptance of the revised terms.'
      ),
    },
  ]

  return (
    <>
      <Header />
      <main className="pt-16" dir={dir}>

        {/* Hero */}
        <section className="bg-cream-dark border-b border-sand/20 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-xs tracking-[0.5em] uppercase text-sand mb-3">{t('قانوني', 'Legal')}</p>
            <h1 className="text-5xl font-light text-charcoal mb-4">
              {t('الشروط والأحكام', 'Terms & Conditions')}
            </h1>
            <p className="text-charcoal/50 text-sm">
              {t('آخر تحديث: مايو ٢٠٢٦', 'Last updated: May 2026')}
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-4 gap-12">

          {/* Sidebar nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-[10px] tracking-widest uppercase text-charcoal/40 mb-4">
                {t('الأقسام', 'Sections')}
              </p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`}
                    className="block text-sm text-charcoal/60 hover:text-sand py-1.5 border-s-2 border-transparent hover:border-sand ps-3 transition-all">
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3 space-y-12">
            <div className="bg-sand/10 border border-sand/30 p-6">
              <p className="text-sm text-charcoal/70 leading-loose">
                {t(
                  'مرحباً بك في دوحة روستري. يُرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام موقعنا أو إجراء أي عملية شراء. تنطبق هذه الشروط على جميع الطلبات والخدمات المقدمة من دوحة روستري في قطر.',
                  'Welcome to Doha Roastery. Please read these Terms and Conditions carefully before using our website or making any purchase. These terms apply to all orders and services provided by Doha Roastery in Qatar.'
                )}
              </p>
            </div>

            {sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-xl font-medium text-charcoal mb-4 pb-3 border-b border-sand/20">
                  {section.title}
                </h2>
                <p className="text-charcoal/70 leading-loose text-sm">
                  {section.content}
                </p>
              </div>
            ))}

            {/* Contact for questions */}
            <div className="bg-cream-dark border border-sand/20 p-8 text-center">
              <h3 className="text-lg font-light text-charcoal mb-3">
                {t('هل لديك أسئلة؟', 'Have Questions?')}
              </h3>
              <p className="text-sm text-charcoal/60 mb-6">
                {t(
                  'إذا كان لديك أي استفسار بشأن هذه الشروط، لا تتردد في التواصل معنا.',
                  'If you have any questions about these terms, feel free to contact us.'
                )}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/contact">
                  <span className="inline-block bg-charcoal text-cream px-6 py-3 text-xs tracking-widest uppercase hover:bg-charcoal-light transition-colors">
                    {t('تواصل معنا', 'Contact Us')}
                  </span>
                </Link>
                <a href="https://wa.me/97466788898" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 text-xs tracking-widest uppercase hover:bg-[#1ebe5d] transition-colors">
                  {t('واتساب', 'WhatsApp')}
                </a>
              </div>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
