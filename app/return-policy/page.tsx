import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ReturnContent } from '@/components/legal/ReturnContent';
import { ReturnHero } from '@/components/legal/ReturnHero';

export const metadata = {
  title: 'Return & Refund Policy | Alzair Dates & Dry Fruits',
  description:
    'Read the Return and Refund Policy for Alzair Dates & Dry Fruits regarding eligibility, replacements, and customer satisfaction guarantee.',
};

export default function ReturnPolicyPage() {
  return (
    <main className="overflow-hidden bg-[#f5f0e7] text-[#171513]">
      <Header />
      <ReturnHero />
      <ReturnContent />
      <Footer />
    </main>
  );
}
