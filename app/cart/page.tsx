import { Suspense } from 'react';
import { CartContent } from '@/components/cart/CartContent';
import { CartHero } from '@/components/cart/CartHero';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Shopping Cart | Alzair Dates & Dry Fruits',
  description: 'View your selected premium dates, laddus, bites, and luxury gift packs in your shopping cart.',
};

export default function CartPage() {
  return (
    <main className="overflow-hidden bg-[#f5f0e7] text-[#171513]">
      <Header />
      <CartHero />
      <Suspense fallback={<div className="py-20 text-center font-sans text-xs font-semibold text-[#8c7e6c]">Loading cart...</div>}>
        <CartContent />
      </Suspense>
      <Footer />
    </main>
  );
}
