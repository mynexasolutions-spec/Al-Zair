import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { TermsContent } from '@/components/legal/TermsContent';
import { TermsHero } from '@/components/legal/TermsHero';

export const metadata = {
  title: 'Terms & Conditions | Alzair Dates & Dry Fruits',
  description:
    'Read the Terms & Conditions for purchasing and using Alzair Dates & Dry Fruits online storefront and customer services.',
};

export default function TermsAndConditionsPage() {
  return (
    <main className="overflow-hidden bg-[#f5f0e7] text-[#171513]">
      <Header />
      <TermsHero />
      <TermsContent />
      <Footer />
    </main>
  );
}
