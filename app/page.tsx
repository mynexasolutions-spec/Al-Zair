import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Gallery } from '@/components/home/Gallery';
import { HealthBenefits } from '@/components/home/HealthBenefits';
import { Hero } from '@/components/home/Hero';
import { Newsletter } from '@/components/home/Newsletter';
import { ProductCategories } from '@/components/home/ProductCategories';
import { Testimonials } from '@/components/home/Testimonials';
import { TrustBar } from '@/components/home/TrustBar';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { defaultHomepageContent, HomepageContent } from '@/data/homepageContent';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const { data, error } = await supabaseAdmin
      .from('homepage_content')
      .select('*')
      .eq('id', 'main_homepage')
      .single();

    if (!error && data) {
      return {
        hero: data.hero || defaultHomepageContent.hero,
        featured_products: data.featured_products || defaultHomepageContent.featured_products,
        testimonials: data.testimonials || defaultHomepageContent.testimonials,
        home_gallery: data.home_gallery || defaultHomepageContent.home_gallery,
      };
    }
  } catch {}

  return defaultHomepageContent;
}

export default async function Home() {
  const content = await getHomepageContent();

  return (
    <main className="overflow-hidden bg-[#f5f0e7] text-[#171513]">
      <Header />
      <Hero data={content.hero} />
      <TrustBar />
      <ProductCategories items={content.featured_products} />
      <WhyChooseUs />
      <HealthBenefits />
      <Gallery items={content.home_gallery} />
      <Testimonials items={content.testimonials} />
      <Newsletter />
      <Footer />
    </main>
  );
}
