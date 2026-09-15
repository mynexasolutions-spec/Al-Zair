import {
  AlertTriangle,
  CheckCircle2,
  Copyright,
  CreditCard,
  FileText,
  Gavel,
  HelpCircle,
  RefreshCw,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';

const termsCards = [
  {
    icon: FileText,
    title: '1. Acceptance of Terms',
    content:
      'Welcome to Alzair Dates Dry Fruits. By accessing our website, browsing our product catalog, or placing an order, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any part of these terms, please do not use our website.',
  },
  {
    icon: ShoppingBag,
    title: '2. Product Information & Availability',
    content:
      'We strive to display our dates, laddus, stuffed dates, date bites, and luxury gift boxes as accurately as possible. However, because our products are 100% natural and handcrafted, slight variations in size, color, texture, and natural moisture may occur. All orders are subject to product availability.',
  },
  {
    icon: CreditCard,
    title: '3. Pricing & Payment Terms',
    content:
      'All prices listed on our website are in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to revise prices, discounts, and promotional offers at any time without prior notice. Payments can be made via UPI, Debit/Credit Cards, Net Banking, or Cash on Delivery (COD).',
  },
  {
    icon: Truck,
    title: '4. Orders & Delivery',
    content:
      'Upon placing an order, you will receive an order confirmation notification. We partner with reliable courier partners to ensure timely delivery across India. Standard delivery typically takes 3-7 business days depending on your location. Delivery timelines may vary due to weather, festive rush, or unforeseen logistical delays.',
  },
  {
    icon: CheckCircle2,
    title: '5. Quality & Freshness Guarantee',
    content:
      'Alzair guarantees the authenticity, purity, and hygienic packing of every single product. All our Arabian dates and dry fruits undergo strict quality checks before dispatch to preserve optimal taste, nutrition, and natural freshness.',
  },
  {
    icon: Copyright,
    title: '6. Intellectual Property Rights',
    content:
      'All content on this website, including logos, graphics, product photographs, text, designs, brand marks, and digital assets, is the exclusive intellectual property of Alzair Dates Dry Fruits and is protected under applicable copyright and trademark laws. Unauthorized reproduction is prohibited.',
  },
  {
    icon: AlertTriangle,
    title: '7. Limitation of Liability',
    content:
      'Alzair Dates Dry Fruits shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. In any event, our total liability shall not exceed the purchase price of the specific product in dispute.',
  },
  {
    icon: Gavel,
    title: '8. Governing Law & Jurisdiction',
    content:
      'These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any legal disputes or claims arising out of or related to our services shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.',
  },
  {
    icon: RefreshCw,
    title: '9. Amendments to Terms',
    content:
      'We reserve the right to modify, update, or replace these Terms and Conditions at our sole discretion. Any changes will become effective immediately upon posting to this page. Continued use of our website constitutes your acceptance of the revised terms.',
  },
  {
    icon: HelpCircle,
    title: '10. Contact & Customer Support',
    content:
      'For any questions, clarifications, or feedback regarding these Terms and Conditions, please reach out to us at alzairdates@gmail.com or call +91 7052375313. Our customer care team is available Monday through Saturday from 9:00 AM to 7:00 PM.',
  },
];

export function TermsContent() {
  return (
    <section className="bg-[#f5f0e7] px-5 py-16 sm:py-20 text-[#171513] font-sans">
      <div className="mx-auto max-w-[1240px]">
        {/* Intro Note */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#a9823b]">
            Store Guidelines
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1714]">
            Please Read These Terms Carefully
          </h2>
          <p className="mt-3 text-sm text-[#5a544b] leading-relaxed">
            By accessing or ordering from Alzair Dates &amp; Dry Fruits, you agree to comply with our store policies, ordering procedures, and service terms.
          </p>
        </div>

        {/* Terms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {termsCards.map((card, idx) => {
            const Icon = card.icon;
            const isLast = idx === termsCards.length - 1;
            return (
              <div
                key={card.title}
                className={`rounded-2xl border border-[#dccbb4] bg-[#ede5d8]/75 p-7 sm:p-9 shadow-[0_8px_24px_rgba(72,53,35,0.05)] transition duration-300 hover:border-[#c49a4a] hover:bg-[#ede5d8] ${
                  isLast && termsCards.length % 2 !== 0 ? 'md:col-span-2' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#171513] text-[#c49a4a] shadow-sm">
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#1a1714]">
                      {card.title}
                    </h2>
                    <div className="mt-1 h-0.5 w-8 bg-[#c49a4a]/60" />
                  </div>
                </div>

                <p className="mt-3 text-xs sm:text-[13.5px] leading-relaxed text-[#554e44]">
                  {card.content}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom Disclaimer */}
        <div className="mt-14 text-center">
          <p className="text-[11px] text-[#786e60]">
            © 2024 Alzair Dates Dry Fruits. All rights reserved. For business or legal inquiries, email us at alzairdates@gmail.com.
          </p>
        </div>
      </div>
    </section>
  );
}
