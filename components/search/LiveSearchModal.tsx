'use client';

import {
  ArrowRight,
  ChevronRight,
  Flame,
  Loader2,
  Search,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { allProducts, Product } from '@/data/catalog';

interface LiveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const popularSearches = [
  'Medjool Dates',
  'Ajwa Dates',
  'Dates Laddu',
  'Stuffed Dates',
  'Date Bites',
  'Gift Box',
];

export function LiveSearchModal({ isOpen, onClose }: LiveSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(allProducts);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);

  // Load products list
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setProducts(json.data);
        }
      } catch {}
    }
    loadProducts();
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Real-time live filtering
  useEffect(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      const filtered = products.filter((p) => {
        const nameMatch = (p.name || '').toLowerCase().includes(clean);
        const catMatch = (p.category || '').toLowerCase().includes(clean);
        const typeMatch = (p.productType || '').toLowerCase().includes(clean);
        const descMatch = (p.shortDescription || '').toLowerCase().includes(clean);
        return nameMatch || catMatch || typeMatch || descMatch;
      });
      setResults(filtered);
      setLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, products]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelectProduct = (id: string) => {
    onClose();
    router.push(`/products/${id}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    router.push(`/products?category=all`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      {/* Search Dialog Box */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#c49a4a]/40 bg-[#12110e] text-white shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-white/10 px-5 py-4">
          <Search size={20} className="text-[#c49a4a] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dates, laddus, stuffed dates, gift boxes..."
            className="w-full bg-transparent pl-3.5 pr-10 text-sm text-white placeholder:text-white/40 outline-none"
          />

          <div className="absolute right-4 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-full p-1 text-white/50 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-white/60 hover:bg-white/20 hover:text-white"
            >
              ESC
            </button>
          </div>
        </form>

        {/* Search Results / Suggestions Area */}
        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
          {/* 1. When query is empty -> Show Popular Quick Searches */}
          {!query.trim() && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#a9823b] mb-3 flex items-center gap-1.5">
                <Flame size={13} />
                <span>Popular Searches</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:border-[#c49a4a] hover:bg-[#c49a4a]/15 hover:text-[#d6b15e]"
                  >
                    <Tag size={12} className="text-[#c49a4a]" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Loading indicator */}
          {loading && (
            <div className="py-10 text-center text-white/50 flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-[#c49a4a]" />
              <span className="text-xs">Searching store inventory...</span>
            </div>
          )}

          {/* 3. Results Found */}
          {!loading && query.trim() && results.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-white/50 pb-1">
                <span>{results.length} Product{results.length === 1 ? '' : 's'} Found</span>
                <span>Click product to view details</span>
              </div>

              <div className="divide-y divide-white/5">
                {results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product.id)}
                    className="group flex items-center justify-between p-3 rounded-xl cursor-pointer transition hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
                        <Image
                          src={product.image || '/images/dates.jpg'}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#c49a4a]">
                          {product.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#d6b15e] transition truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-bold text-white">
                            ₹{(product.price || 0).toLocaleString('en-IN')}
                          </span>
                          {product.originalPrice && (
                            <span className="line-through text-white/40 text-[10px]">
                              ₹{product.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          {product.discount && (
                            <span className="rounded bg-[#c49a4a]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#d6b15e]">
                              {product.discount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-white/30 group-hover:text-[#c49a4a] group-hover:translate-x-0.5 transition shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. No Results Found */}
          {!loading && query.trim() && results.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm font-bold text-white">No products found matching &quot;{query}&quot;</p>
              <p className="mt-1 text-xs text-white/50">
                Try searching for &quot;Dates&quot;, &quot;Laddu&quot;, &quot;Ajwa&quot;, or &quot;Gift Box&quot;
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-white/10 bg-black/40 px-5 py-3 flex items-center justify-between text-[11px] text-white/50">
          <span>Alzair Instant Search</span>
          <Link
            href="/products"
            onClick={onClose}
            className="text-[#c49a4a] font-semibold hover:underline flex items-center gap-1"
          >
            <span>View all products</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
