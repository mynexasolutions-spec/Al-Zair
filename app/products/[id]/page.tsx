import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductDetailView } from '@/components/products/ProductDetailView';
import { Product } from '@/data/catalog';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductPageProps {
  params: { id: string };
}

async function fetchLiveProduct(id: string): Promise<Product | null> {
  const cleanId = decodeURIComponent(id).trim();

  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .or(`id.eq.${cleanId},id.ilike.${cleanId}`)
      .single();

    if (error || !data) {
      return null;
    }

    let galleryImgs: string[] = [];
    if (Array.isArray(data.gallery_images)) {
      galleryImgs = data.gallery_images;
    } else if (typeof data.gallery_images === 'string' && data.gallery_images.trim().startsWith('[')) {
      try { galleryImgs = JSON.parse(data.gallery_images); } catch {}
    } else if (typeof data.gallery_images === 'string' && data.gallery_images.trim()) {
      galleryImgs = [data.gallery_images.trim()];
    }

    const prodImg = data.image || (galleryImgs.length > 0 ? galleryImgs[0] : '');

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      productType: data.product_type || data.productType || 'Premium Dates',
      price: Number(data.price),
      originalPrice: data.original_price ? Number(data.original_price) : undefined,
      discount: data.discount,
      rating: Number(data.rating) || 4.8,
      reviews: Number(data.reviews) || 50,
      image: prodImg,
      galleryImages: galleryImgs.length > 0 ? galleryImgs : (prodImg ? [prodImg] : []),
      inStock: Boolean(data.in_stock !== false),
      weight: data.weight || '500g',
      isNew: Boolean(data.is_new),
      salesCount: Number(data.sales_count) || 0,
      shortDescription: data.short_description || '',
      description: data.description || '',
      ingredients: data.ingredients || '',
      storage: data.storage || '',
      shipping: data.shipping || '',
      couponCode: data.coupon_code || data.couponCode || '',
      couponDiscount: data.coupon_discount || data.couponDiscount || '',
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = params;
  const product = await fetchLiveProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found | Alzair',
    };
  }

  return {
    title: `${product.name} | Alzair Dates & Dry Fruits`,
    description:
      product.shortDescription ||
      `Buy premium ${product.name} at best price with 100% natural quality guaranteed from Alzair.`,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = params;
  const product = await fetchLiveProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <main className="overflow-hidden bg-[#f7f2ea]">
      <Header />
      <ProductDetailView product={product} />
      <Footer />
    </main>
  );
}
