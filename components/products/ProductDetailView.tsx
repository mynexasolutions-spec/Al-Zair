'use client';

import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Heart,
  Leaf,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Product, getRelatedProducts } from '@/data/catalog';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface ProductDetailViewProps {
  product: Product;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Product Images Gallery (Main Image + Additional Uploaded Images)
  const gallery = useMemo(() => {
    const list: string[] = [];
    if (product.image && typeof product.image === 'string' && product.image.trim()) {
      list.push(product.image.trim());
    }
    if (product.galleryImages && Array.isArray(product.galleryImages)) {
      product.galleryImages.forEach((img) => {
        if (img && typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      });
    }
    return list;
  }, [product.galleryImages, product.image]);

  const [activeImage, setActiveImage] = useState<string>(
    product.image || (product.galleryImages && product.galleryImages[0]) || ''
  );

  useEffect(() => {
    if (gallery.length > 0) {
      setActiveImage(gallery[0]);
    } else if (product.image) {
      setActiveImage(product.image);
    } else {
      setActiveImage('');
    }
  }, [gallery, product.image]);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>('DESCRIPTION');
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const rawCode = (product.couponCode || '').trim();
  const rawDiscount = (product.couponDiscount || '').trim();

  // Detect if rawDiscount is actually a coupon code (e.g. ALZ10-VTEG, SAFAWI15, EID20) instead of a discount label (e.g. "10% OFF")
  const isDiscountActuallyACode =
    Boolean(rawDiscount) &&
    !rawDiscount.includes('%') &&
    !rawDiscount.toLowerCase().includes('off') &&
    !rawDiscount.includes(' ') &&
    rawDiscount.length >= 3;

  // Determine the single active coupon code
  let activeCouponCode = '';
  if (isDiscountActuallyACode) {
    activeCouponCode = rawDiscount.toUpperCase();
  } else if (rawCode) {
    activeCouponCode = rawCode.toUpperCase();
  }

  // Format the discount badge: NEVER show a coupon code in the badge
  let activeCouponDiscount = '';
  if (rawDiscount && !isDiscountActuallyACode) {
    activeCouponDiscount = rawDiscount;
  } else if (activeCouponCode) {
    const percentMatch = activeCouponCode.match(/(\d{1,2})/);
    if (percentMatch && Number(percentMatch[1]) > 0 && Number(percentMatch[1]) <= 90) {
      activeCouponDiscount = `${percentMatch[1]}% OFF`;
    } else {
      activeCouponDiscount = 'SPECIAL OFFER';
    }
  }

  const handleCopyCoupon = () => {
    if (activeCouponCode) {
      navigator.clipboard.writeText(activeCouponCode);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2500);
    }
  };

  const relatedProducts = getRelatedProducts(product.id, product.category, 4);

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  const handleAddToCart = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.id}`)}`);
      return;
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        weight: product.weight,
      },
      quantity
    );
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.id}`)}`);
      return;
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        weight: product.weight,
      },
      quantity
    );
    if (activeCouponCode) {
      router.push(`/cart?coupon=${encodeURIComponent(activeCouponCode)}`);
    } else {
      router.push('/cart');
    }
  };

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isCurrentWishlisted = !!wishlist[product.id];

  return (
    <div className="min-h-screen bg-[#f7f2ea] text-[#1a1714]">
      {/* Top Banner with Breadcrumbs */}
      <div className="hero-texture bg-[#0d0d0b] pt-36 pb-10 px-5 text-white sm:pt-40 sm:pb-12 lg:pt-44">
        <div className="mx-auto max-w-[1200px]">
          <nav className="flex items-center gap-2 text-xs sm:text-[13px] text-white/75 font-sans">
            <Link href="/" className="hover:text-[#d6b15e] transition">
              Home
            </Link>
            <ChevronRight size={14} className="text-[#c49a4a]" />
            <Link href="/products" className="hover:text-[#d6b15e] transition">
              Shop
            </Link>
            <ChevronRight size={14} className="text-[#c49a4a]" />
            <Link
              href={`/products?category=${encodeURIComponent(product.category)}`}
              className="hover:text-[#d6b15e] transition"
            >
              {product.category}
            </Link>
            <ChevronRight size={14} className="text-[#c49a4a]" />
            <span className="text-[#d6b15e] font-medium truncate max-w-[200px] sm:max-w-none">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Product Showcase Section */}
      <section className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14 items-start">
            {/* Left Column: Image Gallery, Thumbnails & Product Details Accordion */}
            <div>
              <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden rounded-2xl border border-[#dccbb4] bg-[#171512] shadow-lg">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    priority
                    className="object-cover transition-all duration-300"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-[#9c8973]">
                    <PackageCheck size={48} className="mb-2 opacity-30 text-[#d6b15e]" />
                    <p className="text-xs font-medium tracking-wide uppercase">No Image Uploaded</p>
                  </div>
                )}

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Add to wishlist"
                  className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
                >
                  <Heart
                    size={18}
                    className={isCurrentWishlisted ? 'fill-rose-500 text-rose-500' : ''}
                  />
                </button>
              </div>

              {/* Thumbnails Row (Only when multiple photos exist) */}
              {gallery.length > 1 && (
                <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className={`relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-lg border-2 transition-all shrink-0 ${
                        activeImage === img
                          ? 'border-[#c49a4a] ring-2 ring-[#c49a4a]/30 scale-105'
                          : 'border-[#dccbb4] hover:border-[#c49a4a]/60 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* ==================== PRODUCT DETAILS ACCORDION (LEFT COLUMN) ==================== */}
              <div className="mt-10 pt-2">
                <h2 className="font-serif text-2xl text-[#1a1714] font-medium mb-4">
                  Product Details
                </h2>

                <div className="border border-[#d5c7b3] bg-transparent font-sans">
                  {/* DESCRIPTION */}
                  <div className="border-b border-[#d5c7b3]">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('DESCRIPTION')}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[.15em] text-[#1a1714] transition hover:bg-[#ede5d8]/40"
                    >
                      <span>DESCRIPTION</span>
                      <ChevronDown
                        size={14}
                        className={`text-[#786e60] transition-transform duration-300 ${
                          openAccordion === 'DESCRIPTION' ? 'rotate-180 text-[#a9823b]' : ''
                        }`}
                      />
                    </button>
                    {openAccordion === 'DESCRIPTION' && (
                      <div className="px-4 pb-4 pt-1 text-xs leading-relaxed text-[#554e44] animate-in fade-in">
                        <p>
                          {product.description ||
                            `Indulge in our exquisite ${product.name}, handpicked from the finest palm groves. Rich in natural flavor, luscious softness, and wholesome goodness, each bite delivers an authentic taste of pure luxury.`}
                        </p>
                        <p className="mt-2.5">
                          Naturally rich in essential dietary minerals, antioxidants, and dietary fiber,
                          they make the perfect wholesome snack for sustained energy throughout the day.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* INGREDIENTS */}
                  <div className="border-b border-[#d5c7b3]">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('INGREDIENTS')}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[.15em] text-[#1a1714] transition hover:bg-[#ede5d8]/40"
                    >
                      <span>INGREDIENTS</span>
                      <ChevronDown
                        size={14}
                        className={`text-[#786e60] transition-transform duration-300 ${
                          openAccordion === 'INGREDIENTS' ? 'rotate-180 text-[#a9823b]' : ''
                        }`}
                      />
                    </button>
                    {openAccordion === 'INGREDIENTS' && (
                      <div className="px-4 pb-4 pt-1 text-xs leading-relaxed text-[#554e44] animate-in fade-in">
                        <p>
                          {product.ingredients ||
                            '100% Pure Natural Dates. No added sugar, no artificial preservatives, zero trans fat, zero artificial colors.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* NUTRITIONAL INFORMATION */}
                  <div className="border-b border-[#d5c7b3]">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('NUTRITION')}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[.15em] text-[#1a1714] transition hover:bg-[#ede5d8]/40"
                    >
                      <span>NUTRITIONAL INFORMATION</span>
                      <ChevronDown
                        size={14}
                        className={`text-[#786e60] transition-transform duration-300 ${
                          openAccordion === 'NUTRITION' ? 'rotate-180 text-[#a9823b]' : ''
                        }`}
                      />
                    </button>
                    {openAccordion === 'NUTRITION' && (
                      <div className="px-4 pb-4 pt-1 text-xs leading-relaxed text-[#554e44] animate-in fade-in">
                        <div className="grid grid-cols-2 gap-2.5 py-1">
                          <div className="rounded bg-[#ede5d8]/70 p-2.5 text-center border border-[#dccbb4]">
                            <span className="block text-[10px] uppercase tracking-wider text-[#786e60]">Energy</span>
                            <span className="text-sm font-bold text-[#1a1714]">277 kcal</span>
                          </div>
                          <div className="rounded bg-[#ede5d8]/70 p-2.5 text-center border border-[#dccbb4]">
                            <span className="block text-[10px] uppercase tracking-wider text-[#786e60]">Carbohydrates</span>
                            <span className="text-sm font-bold text-[#1a1714]">75g</span>
                          </div>
                          <div className="rounded bg-[#ede5d8]/70 p-2.5 text-center border border-[#dccbb4]">
                            <span className="block text-[10px] uppercase tracking-wider text-[#786e60]">Dietary Fiber</span>
                            <span className="text-sm font-bold text-[#1a1714]">7g</span>
                          </div>
                          <div className="rounded bg-[#ede5d8]/70 p-2.5 text-center border border-[#dccbb4]">
                            <span className="block text-[10px] uppercase tracking-wider text-[#786e60]">Potassium</span>
                            <span className="text-sm font-bold text-[#1a1714]">656mg</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STORAGE INSTRUCTIONS */}
                  <div className="border-b border-[#d5c7b3]">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('STORAGE')}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[.15em] text-[#1a1714] transition hover:bg-[#ede5d8]/40"
                    >
                      <span>STORAGE INSTRUCTIONS</span>
                      <ChevronDown
                        size={14}
                        className={`text-[#786e60] transition-transform duration-300 ${
                          openAccordion === 'STORAGE' ? 'rotate-180 text-[#a9823b]' : ''
                        }`}
                      />
                    </button>
                    {openAccordion === 'STORAGE' && (
                      <div className="px-4 pb-4 pt-1 text-xs leading-relaxed text-[#554e44] animate-in fade-in">
                        <p>
                          {product.storage ||
                            'Store in a cool, dry place away from direct sunlight. Once opened, keep sealed in an airtight container or refrigerate to preserve optimal freshness, aroma and softness.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* SHIPPING INFORMATION */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleAccordion('SHIPPING')}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[.15em] text-[#1a1714] transition hover:bg-[#ede5d8]/40"
                    >
                      <span>SHIPPING INFORMATION</span>
                      <ChevronDown
                        size={14}
                        className={`text-[#786e60] transition-transform duration-300 ${
                          openAccordion === 'SHIPPING' ? 'rotate-180 text-[#a9823b]' : ''
                        }`}
                      />
                    </button>
                    {openAccordion === 'SHIPPING' && (
                      <div className="px-4 pb-4 pt-1 text-xs leading-relaxed text-[#554e44] animate-in fade-in">
                        <p>
                          {product.shipping ||
                            'Free standard shipping on all orders. Dispatched within 24 hours in insulated protective packaging. Standard delivery within 3-5 business days across India.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Product Info & Actions */}
            <div className="flex flex-col">
              {/* Category Badge */}
              <span className="text-[11px] font-bold uppercase tracking-[.2em] text-[#a9823b] font-sans">
                {product.category}
              </span>

              {/* Title */}
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-[#1a1714] font-medium leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-2 text-sm text-[#786e60] font-sans">
                <div className="flex items-center text-[#c49a4a]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className={
                        i < Math.floor(product.rating)
                          ? 'fill-[#c49a4a] text-[#c49a4a]'
                          : 'text-[#d8c5aa]'
                      }
                    />
                  ))}
                </div>
                <span className="font-bold text-[#1a1714]">{product.rating}</span>
                <span>({product.reviews} reviews)</span>
              </div>

              {/* Price Row */}
              <div className="mt-5 flex items-center gap-3">
                <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#1a1714]">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && (
                  <span className="text-base text-[#8c7e6c] line-through font-sans">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {product.discount && (
                  <span className="rounded bg-[#c49a4a] px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[#171513] font-sans">
                    SAVE {product.discount}
                  </span>
                )}
              </div>

              {/* Short Description */}
              <p className="mt-5 text-sm sm:text-base leading-relaxed text-[#554e44] font-sans">
                {product.shortDescription ||
                  'Premium quality Halasi dates carefully selected for their natural sweetness, softness and nutritional value. 100% pure, natural and hygienic.'}
              </p>

              {/* In Stock Badge */}
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 font-sans">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>In Stock ({product.weight || '500g'})</span>
              </div>

              {/* Exclusive Product Coupon Offer */}
              {activeCouponCode && (
                <div className="mt-5 rounded-xl border-2 border-dashed border-[#c49a4a]/80 bg-[#ede5d8]/80 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#b89047] text-[#171513]">
                        <Tag size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a9823b] font-sans">
                            Exclusive Coupon Offer
                          </span>
                          {activeCouponDiscount && (
                            <span className="rounded-full bg-[#171513] px-2 py-0.5 text-[10px] font-bold text-[#f5f0e7] font-sans">
                              {activeCouponDiscount}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-[#554e44] font-sans">
                          Use code <span className="font-mono font-bold text-[#171513] bg-white px-2 py-0.5 rounded border border-[#dccbb4] select-all">{activeCouponCode}</span> at cart
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold font-sans transition-all duration-300 shrink-0 shadow-sm ${
                        copiedCoupon
                          ? 'bg-emerald-700 text-white'
                          : 'bg-[#171513] text-[#f5f0e7] hover:bg-[#b89047] hover:text-[#171513]'
                      }`}
                    >
                      {copiedCoupon ? (
                        <>
                          <Check size={14} />
                          <span>COPIED!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>COPY CODE</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Quantity Stepper */}
                <div className="flex items-center justify-between border border-[#dccbb4] bg-white rounded-lg px-3 py-2.5 w-full sm:w-36 font-sans">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="text-[#786e60] hover:text-[#1a1714] p-1 transition disabled:opacity-40"
                    disabled={quantity <= 1}
                  >
                    <Minus size={15} />
                  </button>
                  <span className="font-bold text-sm text-[#1a1714] px-3">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="text-[#786e60] hover:text-[#1a1714] p-1 transition"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Add To Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#b89047] px-6 py-3 text-xs font-bold tracking-wider text-[#171513] shadow-md transition duration-300 hover:bg-[#a67e35] active:scale-95 font-sans"
                >
                  <ShoppingBag size={16} />
                  <span>ADD TO CART</span>
                </button>

                {/* Buy Now */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 flex items-center justify-center rounded-lg border-2 border-[#171513] px-6 py-3 text-xs font-bold tracking-wider text-[#171513] transition duration-300 hover:bg-[#171513] hover:text-white active:scale-95 font-sans"
                >
                  BUY NOW
                </button>
              </div>

              {/* Trust Badges 2x2 */}
              <div className="mt-10 grid grid-cols-2 gap-4 border-t border-[#ebdcca] pt-6 font-sans">
                <div className="flex items-center gap-2.5 text-xs text-[#3a352e] font-medium">
                  <Leaf size={16} className="text-[#a9823b] shrink-0" />
                  <span>100% Natural</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#3a352e] font-medium">
                  <ShieldCheck size={16} className="text-[#a9823b] shrink-0" />
                  <span>Premium Quality</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#3a352e] font-medium">
                  <PackageCheck size={16} className="text-[#a9823b] shrink-0" />
                  <span>Hygienic Packed</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#3a352e] font-medium">
                  <Sparkles size={16} className="text-[#a9823b] shrink-0" />
                  <span>Freshness Guaranteed</span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== YOU MAY ALSO LIKE ==================== */}
          <div className="mt-20 sm:mt-24 pt-12 border-t border-[#dccbb4]">
            <div className="text-center mb-10">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1a1714] font-medium">
                You May Also Like
              </h2>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="h-[1px] w-12 bg-[#c49a4a]/40" />
                <span className="h-1.5 w-1.5 rotate-45 border border-[#c49a4a] bg-[#c49a4a]" />
                <span className="h-[1px] w-12 bg-[#c49a4a]/40" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {relatedProducts.map((rel) => {
                const isRelWishlisted = !!wishlist[rel.id];
                return (
                  <div
                    key={rel.id}
                    className="group flex flex-col justify-between rounded-xl border border-[#dccbb4] bg-white overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-[#171512]">
                      <Link href={`/products/${rel.id}`} className="block h-full w-full">
                        <Image
                          src={rel.image}
                          alt={rel.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      </Link>

                      {rel.discount && (
                        <span className="absolute left-2.5 top-2.5 rounded bg-[#c49a4a] px-2 py-0.5 text-[10px] font-bold text-[#171513] font-sans">
                          -{rel.discount}
                        </span>
                      )}

                      <button
                        onClick={() => toggleWishlist(rel.id)}
                        aria-label="Add to wishlist"
                        className="absolute right-2.5 top-2.5 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/70"
                      >
                        <Heart
                          size={14}
                          className={isRelWishlisted ? 'fill-rose-500 text-rose-500' : ''}
                        />
                      </button>
                    </div>

                    {/* Details */}
                    <div className="p-4 flex flex-col flex-1 justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#a9823b] font-sans">
                          {rel.category}
                        </span>
                        <Link href={`/products/${rel.id}`}>
                          <h4 className="mt-1 text-sm font-bold text-[#1a1714] font-sans line-clamp-1 group-hover:text-[#a9823b] transition-colors">
                            {rel.name}
                          </h4>
                        </Link>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-[#786e60] font-sans">
                          <Star size={11} className="fill-[#a9823b] text-[#a9823b]" />
                          <span className="font-bold text-[#1a1714]">{rel.rating}</span>
                          <span>({rel.reviews})</span>
                        </div>
                      </div>

                      {/* Price & Add to Cart */}
                      <div className="mt-4 flex items-center justify-between pt-2 border-t border-[#f0e6d8]">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-[#1a1714] font-sans">
                            ₹{rel.price.toLocaleString('en-IN')}
                          </span>
                          {rel.originalPrice && (
                            <span className="text-[11px] text-[#8c7e6c] line-through font-sans">
                              ₹{rel.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!user) {
                              router.push(`/login?redirect=${encodeURIComponent(`/products/${rel.id}`)}`);
                              return;
                            }
                            addToCart({
                              id: rel.id,
                              name: rel.name,
                              price: rel.price,
                              image: rel.image,
                              weight: rel.weight,
                            });
                          }}
                          aria-label={`Add ${rel.name} to cart`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171513] text-white shadow-sm transition hover:bg-[#b89047] hover:text-[#171513] active:scale-90"
                        >
                          <ShoppingBag size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
