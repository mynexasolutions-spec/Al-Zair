'use client';

import { ArrowUp, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import Image from 'next/image';

export function Footer() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="hero-texture bg-[#0a0908] px-5 pb-8 pt-14 text-white sm:px-8 font-sans">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-6 gap-y-10 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr_1.4fr] lg:gap-8">
        {/* Brand info */}
        <div className="col-span-2 lg:col-span-1">
          <a href="/" className="mb-5 inline-block" aria-label="Al Zair home">
            <Image
              src="/images/logo.png"
              alt="Al Zair"
              width={360}
              height={120}
              className="h-16 w-auto object-contain sm:h-20 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-105"
            />
          </a>

          <p className="max-w-[260px] text-sm leading-6 text-white/75">
            We bring you the finest quality dates and date-based products, packed with purity, nutrition and love.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c49a4a]/60 text-[#c49a4a] transition hover:border-[#c49a4a] hover:bg-[#c49a4a]/15"
            >
              <Facebook size={15} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c49a4a]/60 text-[#c49a4a] transition hover:border-[#c49a4a] hover:bg-[#c49a4a]/15"
            >
              <Instagram size={15} />
            </a>
            <a
              href="https://wa.me/917052375313"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c49a4a]/60 text-[#c49a4a] transition hover:border-[#c49a4a] hover:bg-[#c49a4a]/15"
            >
              <MessageCircle size={15} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="col-span-1">
          <FooterList
            title="Quick Links"
            items={['Home', 'Products', 'About Us', 'Gallery', 'Contact Us']}
          />
        </div>

        {/* Our Products */}
        <div className="col-span-1">
          <FooterList
            title="Our Products"
            items={['Dates', 'Dates Laddu', 'Stuffed Dates', 'Date Bites', 'Gift Packs']}
          />
        </div>

        {/* Customer Care */}
        <div className="col-span-1">
          <FooterList
            title="Customer Care"
            items={['About Us', 'Shipping & Delivery', 'Return Policy', 'Privacy Policy', 'Terms & Conditions']}
          />
        </div>

        {/* Contact Us */}
        <div className="col-span-1">
          <h3 className="mb-4 text-[13px] font-bold uppercase tracking-[.18em] text-[#c49a4a]">
            Contact Us
          </h3>
          <div className="space-y-3.5 text-[14px] text-white/85">
            <div className="flex items-start gap-2.5">
              <Phone size={16} className="mt-0.5 shrink-0 text-[#c49a4a]" />
              <div>
                <a href="tel:+917052375313" className="transition-colors hover:text-[#d6b15e]">
                  +91 7052375313
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="shrink-0 text-[#c49a4a]" />
              <a href="mailto:alzairdates@gmail.com" className="break-all transition-colors hover:text-[#c49a4a]">
                alzairdates@gmail.com
              </a>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-[#c49a4a]" />
              <p>Madanpur Khadar,<br />New Delhi - 110076</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Back to Top */}
      <div className="mx-auto flex max-w-[1240px] items-center justify-between pt-6 text-[13px] tracking-wide text-white/70">
        <span>© 2024 Alzair Dates Dry Fruits. All Rights Reserved.</span>
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b89047] text-[#171513] shadow-md transition hover:scale-105 hover:bg-[#a67e35] active:scale-95"
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      </div>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: string[] }) {
  const getHref = (item: string) => {
    if (item === 'Home') return '/';
    if (item === 'About Us') return '/about';
    if (item === 'Products') return '/products';
    if (['Dates', 'Dates Laddu', 'Stuffed Dates', 'Date Bites', 'Gift Packs'].includes(item)) {
      return `/products?category=${encodeURIComponent(item)}`;
    }
    if (item === 'Gallery') return '/gallery';
    if (item === 'Contact Us' || item === 'Contact') return '/contact';
    if (item === 'Privacy Policy') return '/privacy-policy';
    if (item === 'Return Policy' || item === 'Return & Refund Policy') return '/return-policy';
    if (item === 'Terms & Conditions' || item === 'Terms and Conditions' || item === 'Terms of Service') return '/terms-and-conditions';
    if (item === 'Benefits') return '/#benefits';
    return `/#${item.toLowerCase().replace(/ & | /g, '-')}`;
  };

  return (
    <div>
      <h3 className="mb-4 text-[13px] font-bold uppercase tracking-[.18em] text-[#c49a4a]">{title}</h3>
      <ul className="space-y-2.5 text-[14px] text-white/80">
        {items.map((item) => (
          <li key={item}>
            <a href={getHref(item)} className="transition-colors hover:text-[#d6b15e]">
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
