import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  HelpCircle,
  PackageCheck,
  PackageX,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  Truck,
  Utensils,
} from 'lucide-react';

const returnCards = [
  {
    icon: ShieldCheck,
    title: '1. Quality & Freshness Guarantee',
    content:
      'At Alzair Dates Dry Fruits, customer satisfaction and premium food quality are our highest priorities. We carefully inspect, grade, and hygienically seal all dates, laddus, stuffed dates, and gift packs prior to dispatch to ensure they reach you in pristine condition.',
  },
  {
    icon: RotateCcw,
    title: '2. Eligibility for Returns & Replacements',
    content:
      'Given that our products are edible perishable food items, returns are accepted exclusively if: (a) the product received is damaged or defective; (b) the packaging seal was broken/tampered during transit; or (c) an incorrect item was delivered to you.',
  },
  {
    icon: Clock,
    title: '3. 48-Hour Reporting Window',
    content:
      'To be eligible for a replacement or refund, please notify our customer care team within 48 hours of receiving your parcel. Please provide your Order ID along with clear photographs or a short video showing the outer package and the damaged/incorrect product.',
  },
  {
    icon: Utensils,
    title: '4. Perishable Goods Hygiene Policy',
    content:
      'Due to strict food safety and hygiene guidelines, opened products that have been partially consumed or items returned without original packaging cannot be accepted for return or refund unless verified to be defective by our quality team.',
  },
  {
    icon: PackageCheck,
    title: '5. Return & Verification Process',
    content:
      'Once you report an issue, our team will review the details within 24 business hours. If approved, we will either arrange a complimentary reverse pickup or immediately dispatch a fresh replacement batch at no additional cost.',
  },
  {
    icon: CreditCard,
    title: '6. Refund Timelines & Method',
    content:
      'Approved refunds are initiated immediately and credited back to your original payment method (Bank Account, UPI, Debit/Credit Card) within 5 to 7 business days. For Cash on Delivery (COD) orders, refunds will be transferred directly to your verified bank account or UPI ID.',
  },
  {
    icon: PackageX,
    title: '7. Order Cancellation Policy',
    content:
      'You can cancel an order free of charge before it is dispatched from our fulfillment facility. Once the order has shipped and a tracking number is generated, standard cancellation is no longer possible.',
  },
  {
    icon: Truck,
    title: '8. Damaged Shipments & Lost Parcels',
    content:
      'If the outer shipping box appears severely crushed, torn, or opened upon delivery, please reject the package from the courier agent or record an unboxing video to assist with an expedited claims and replacement process.',
  },
  {
    icon: PhoneCall,
    title: '9. Dedicated Support & Assistance',
    content:
      'Our customer care team is dedicated to providing quick and friendly resolutions. Email us at alzairdates@gmail.com, call +91 7052375313, or reach out directly on WhatsApp with your Order ID for immediate support.',
  },
];

export function ReturnContent() {
  return (
    <section className="bg-[#f5f0e7] px-5 py-16 sm:py-20 text-[#171513] font-sans">
      <div className="mx-auto max-w-[1240px]">
        {/* Intro Highlight Banner */}
        <div className="mb-12 rounded-2xl border border-[#c49a4a]/40 bg-[#ede5d8] p-6 sm:p-8 shadow-[0_8px_28px_rgba(72,53,35,0.06)] text-center max-w-3xl mx-auto">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#171513] text-[#c49a4a] mb-3 shadow">
            <RotateCcw size={22} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1714]">
            Hassle-Free Returns &amp; Freshness Assurance
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#5a544b] leading-relaxed">
            We stand 100% behind our Arabian dates and dry fruit delicacies. If your order arrives damaged, defective, or incorrect, we guarantee a swift replacement or full refund within 48 hours of delivery.
          </p>
        </div>

        {/* Policy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {returnCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="flex flex-col justify-between rounded-2xl border border-[#dccbb4] bg-[#ede5d8]/75 p-6 sm:p-7 shadow-[0_6px_20px_rgba(72,53,35,0.05)] transition duration-300 hover:border-[#c49a4a] hover:bg-[#ede5d8]"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#171513] text-[#c49a4a] shadow-sm">
                      <Icon size={17} strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold tracking-tight text-[#1a1714]">
                        {card.title}
                      </h3>
                      <div className="mt-0.5 h-0.5 w-6 bg-[#c49a4a]/60" />
                    </div>
                  </div>

                  <p className="mt-3 text-xs sm:text-[13px] leading-relaxed text-[#554e44]">
                    {card.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Contact Box */}
        <div className="mt-14 rounded-2xl border border-[#dccbb4] bg-[#ede5d8] p-8 text-center max-w-xl mx-auto shadow-sm">
          <h3 className="text-base font-bold text-[#1a1714]">Need assistance with an existing order?</h3>
          <p className="mt-1.5 text-xs text-[#5a544b]">
            Our support team is happy to assist you with any return or replacement inquiries.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:alzairdates@gmail.com"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#171513] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#a9823b]"
            >
              Email Support
            </a>
            <a
              href="https://wa.me/917052375313"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#c49a4a] bg-[#fdfbf7] px-5 py-2 text-xs font-bold text-[#171513] transition hover:bg-[#c49a4a]"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
