'use client';

import { ChevronDown, ChevronLeft, ChevronRight, Filter, Heart, ShoppingBag, Star, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { allProducts, Product } from '@/data/catalog';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

const defaultCategories = ['Dates', 'Dates Laddu', 'Stuffed Dates', 'Date Bites', 'Gift Packs'];
const productTypesList = ['Premium Dates', 'Healthy Snacks', 'Gift Products'] as const;

const sortOptions = [
  'Featured',
  'Newest',
  'Price: Low to High',
  'Price: High to Low',
  'Best Selling',
] as const;

const ITEMS_PER_PAGE = 8;

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');
  const gridTopRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { addToCart } = useCart();

  // Dynamic Data State
  const [products, setProducts] = useState<Product[]>(allProducts);
  const [categoriesList, setCategoriesList] = useState<string[]>(defaultCategories);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('Featured');
  const [sortOpen, setSortOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 1. Fetch Dynamic Products
  useEffect(() => {
    async function fetchLiveProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setProducts(json.data);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchLiveProducts();
  }, []);

  // 2. Fetch Dynamic Categories
  useEffect(() => {
    async function fetchLiveCategories() {
      try {
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategoriesList(json.data);
        }
      } catch {}
    }
    fetchLiveCategories();
  }, []);

  // 3. Sync category from URL search params
  useEffect(() => {
    if (initialCategory && initialCategory !== 'all') {
      setSelectedCategories([initialCategory]);
      setCurrentPage(1);
    } else if (initialCategory === 'all') {
      setSelectedCategories([]);
      setCurrentPage(1);
    }
  }, [initialCategory]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, minPrice, maxPrice, selectedTypes, inStockOnly, sortBy]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setMinPrice(0);
    setMaxPrice(5000);
    setSelectedTypes([]);
    setInStockOnly(false);
    setSortBy('Featured');
    setCurrentPage(1);
  };

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      // Category filter (case-insensitive matching)
      if (selectedCategories.length > 0) {
        const matchesCategory = selectedCategories.some(
          (sel) => sel.toLowerCase().trim() === (product.category || '').toLowerCase().trim()
        );
        if (!matchesCategory) return false;
      }
      // Price filter
      if (product.price < minPrice || product.price > maxPrice) {
        return false;
      }
      // Product Type filter
      if (
        selectedTypes.length > 0 &&
        product.productType &&
        !selectedTypes.includes(product.productType)
      ) {
        return false;
      }
      // In Stock
      if (inStockOnly && !product.inStock) {
        return false;
      }
      return true;
    });

    // Sorting
    if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price: High to Low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Newest') {
      result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (sortBy === 'Best Selling') {
      result.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    }

    return result;
  }, [products, selectedCategories, minPrice, maxPrice, selectedTypes, inStockOnly, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (gridTopRef.current) {
        gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const startIndex = filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length);

  return (
    <section className="bg-[#f5f0e7] px-5 py-12 sm:py-16 text-[#171513]">
      <div className="mx-auto max-w-[1240px]">
        {/* Mobile Filter Trigger */}
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-[#d5c7b3] bg-[#ede5d8] px-4 py-2 text-xs font-bold text-[#1a1714]"
          >
            <Filter size={14} />
            <span>FILTERS</span>
            {selectedCategories.length > 0 && (
              <span className="rounded-full bg-[#b89047] px-1.5 py-0.2 text-[10px] text-white">
                {selectedCategories.length}
              </span>
            )}
          </button>
          <span className="text-xs text-[#5e5850]">
            Showing {filteredProducts.length} of {products.length} products
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 xl:gap-10 items-start">
          {/* ==================== LEFT FILTERS SIDEBAR (DESKTOP) ==================== */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#ede5d8] p-6 shadow-2xl transition-transform duration-300 overflow-y-auto lg:static lg:z-0 lg:w-auto lg:rounded-2xl lg:border lg:border-[#dccbb4] lg:bg-[#ede5d8]/75 lg:p-6 lg:shadow-none ${
              mobileFiltersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#dccbb4] pb-4 mb-6">
              <h3 className="text-xs font-bold tracking-[.18em] uppercase text-[#1a1714] font-sans">
                Filters
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="lg:hidden text-[#1a1714]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Filter (Dynamic) */}
            <div className="border-b border-[#ebdcca] pb-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-bold tracking-[.15em] uppercase text-[#554e44] font-sans">
                  Category
                </h4>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-[10px] text-[#a9823b] hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {categoriesList.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2.5 text-[13.5px] text-[#3a352e] cursor-pointer hover:text-[#1a1714] font-sans select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.some(
                        (s) => s.toLowerCase().trim() === cat.toLowerCase().trim()
                      )}
                      onChange={() => toggleCategory(cat)}
                      className="h-4 w-4 rounded border-[#d5c7b3] text-[#b89047] focus:ring-[#b89047] accent-[#b89047]"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="border-b border-[#ebdcca] pb-6 mb-6">
              <h4 className="text-xs font-bold tracking-[.15em] uppercase text-[#554e44] mb-3 font-sans">
                Price Range
              </h4>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full rounded border border-[#d5c7b3] bg-white px-2.5 py-1.5 text-xs text-[#1a1714] text-center outline-none"
                  placeholder="0"
                />
                <span className="text-[#8c7e6c]">—</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full rounded border border-[#d5c7b3] bg-white px-2.5 py-1.5 text-xs text-[#1a1714] text-center outline-none"
                  placeholder="5000"
                />
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#b89047] cursor-pointer"
              />
              <p className="mt-1.5 text-xs text-[#786e60] font-sans">
                ₹{minPrice} — ₹{maxPrice}
              </p>
            </div>

            {/* Product Type Filter */}
            <div className="border-b border-[#ebdcca] pb-6 mb-6">
              <h4 className="text-xs font-bold tracking-[.15em] uppercase text-[#554e44] mb-3 font-sans">
                Product Type
              </h4>
              <div className="space-y-2.5">
                {productTypesList.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2.5 text-[13.5px] text-[#3a352e] cursor-pointer hover:text-[#1a1714] font-sans select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                      className="h-4 w-4 rounded border-[#d5c7b3] text-[#b89047] focus:ring-[#b89047] accent-[#b89047]"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="border-b border-[#ebdcca] pb-6 mb-6">
              <h4 className="text-[11px] font-bold tracking-[.15em] uppercase text-[#554e44] mb-3 font-sans">
                Availability
              </h4>
              <label className="flex items-center gap-2.5 text-xs text-[#3a352e] cursor-pointer hover:text-[#1a1714] font-sans select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-[#d5c7b3] text-[#b89047] focus:ring-[#b89047] accent-[#b89047]"
                />
                <span>In Stock</span>
              </label>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={clearAllFilters}
              className="text-[10px] font-bold uppercase tracking-[.15em] text-[#a9823b] hover:text-[#886729] transition font-sans"
            >
              Clear All Filters
            </button>
          </aside>

          {/* Backdrop for mobile filters */}
          {mobileFiltersOpen && (
            <div
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
          )}

          {/* ==================== RIGHT MAIN PRODUCTS GRID ==================== */}
          <div ref={gridTopRef} className="scroll-mt-32">
            {/* Top Bar (Count & Sort Dropdown) */}
            <div className="mb-6 flex items-center justify-between">
              <span className="hidden sm:inline text-xs text-[#5e5850] font-sans">
                Showing {startIndex}–{endIndex} of {filteredProducts.length} products
              </span>

              {/* Sort Dropdown */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 rounded-lg border border-[#dccbb4] bg-white px-4 py-2 text-xs font-semibold text-[#1a1714] shadow-sm hover:border-[#b89047] transition font-sans"
                >
                  <span className="text-[#786e60]">Sort:</span>
                  <span>{sortBy}</span>
                  <ChevronDown size={14} className="text-[#a9823b]" />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-[#dccbb4] bg-[#f5f0e7] p-2 shadow-2xl z-30 animate-in fade-in zoom-in-95">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left rounded-md px-3 py-2 text-xs font-medium transition ${
                          sortBy === opt
                            ? 'text-[#a9823b] font-bold bg-[#ede5d8]'
                            : 'text-[#3a352e] hover:bg-[#ede5d8]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-[#dccbb4] bg-[#ede5d8]/75 p-12 text-center my-6">
                <p className="text-base font-bold text-[#1a1714] font-sans">
                  No products match your selected filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 rounded-full bg-[#b89047] px-6 py-2 text-xs font-bold tracking-wider text-[#171513] hover:bg-[#a67e35] transition"
                >
                  RESET FILTERS
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {paginatedProducts.map((product) => {
                    const isWishlisted = !!wishlist[product.id];
                    return (
                      <div
                        key={product.id}
                        className="group flex flex-col justify-between rounded-xl border border-[#dccbb4] bg-white overflow-hidden shadow-[0_4px_16px_rgba(72,53,35,0.06)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(72,53,35,0.12)] hover:-translate-y-1"
                      >
                        {/* Product Image Area */}
                        <div className="relative aspect-square w-full overflow-hidden bg-[#171512]">
                          <Link href={`/products/${product.id}`} className="block h-full w-full">
                            <Image
                              src={product.image || '/images/dates.jpg'}
                              alt={product.name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                            />
                          </Link>

                          {/* Discount Tag */}
                          {product.discount && (
                            <span className="absolute left-2.5 top-2.5 rounded bg-[#c49a4a] px-2 py-0.5 text-[10px] font-bold text-[#171513] shadow-sm font-sans pointer-events-none">
                              -{product.discount}
                            </span>
                          )}

                          {/* Wishlist Heart */}
                          <button
                            onClick={() => toggleWishlist(product.id)}
                            aria-label="Add to wishlist"
                            className="absolute right-2.5 top-2.5 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/70 z-10"
                          >
                            <Heart
                              size={14}
                              className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''}
                            />
                          </button>
                        </div>

                        {/* Product Details Area */}
                        <div className="p-4 flex flex-col flex-1 justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#a9823b] font-sans">
                              {product.category}
                            </p>

                            <Link href={`/products/${product.id}`} className="block">
                              <h4 className="mt-1 text-[15px] font-bold text-[#1a1714] font-sans line-clamp-1 group-hover:text-[#a9823b] transition-colors">
                                {product.name}
                              </h4>
                            </Link>

                            {/* Ratings */}
                            <div className="mt-1.5 flex items-center gap-1 text-xs text-[#786e60] font-sans">
                              <Star
                                size={13}
                                className="fill-[#a9823b] text-[#a9823b]"
                              />
                              <span className="font-bold text-[#1a1714]">
                                {product.rating || 4.8}
                              </span>
                              <span>({product.reviews || 50})</span>
                            </div>
                          </div>

                          {/* Price & Add to Cart Button */}
                          <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-[#f0e6d8]">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[15px] font-bold text-[#1a1714] font-sans">
                                ₹{(product.price || 0).toLocaleString('en-IN')}
                              </span>
                              {product.originalPrice && (
                                <span className="text-xs text-[#8c7e6c] line-through font-sans">
                                  ₹{product.originalPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>

                            {/* Black Circular Add to Cart Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (!user) {
                                  router.push(`/login?redirect=${encodeURIComponent(`/products/${product.id}`)}`);
                                  return;
                                }
                                addToCart({
                                  id: product.id,
                                  name: product.name,
                                  price: product.price,
                                  image: product.image || '/images/dates.jpg',
                                  weight: product.weight || '500g',
                                });
                              }}
                              aria-label={`Add ${product.name} to cart`}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171513] text-white shadow-md transition duration-300 hover:bg-[#b89047] hover:text-[#171513] active:scale-90"
                            >
                              <ShoppingBag size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ==================== PAGINATION CONTROLS ==================== */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    {/* Previous Button */}
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => goToPage(currentPage - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dccbb4] bg-white text-[#1a1714] transition hover:border-[#b89047] hover:bg-[#ede5d8] disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => goToPage(pageNum)}
                          className={`flex h-9 min-w-[36px] px-2 items-center justify-center rounded-full text-xs font-bold transition font-sans ${
                            isActive
                              ? 'bg-[#b89047] text-[#171513] shadow-md'
                              : 'border border-[#dccbb4] bg-white text-[#554e44] hover:border-[#b89047] hover:bg-[#ede5d8]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Next Button */}
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dccbb4] bg-white text-[#1a1714] transition hover:border-[#b89047] hover:bg-[#ede5d8] disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductsGrid() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm">Loading collection...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
