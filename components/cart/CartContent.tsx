'use client';

import { ArrowRight, Check, Lock, LogIn, Minus, Plus, ShoppingBag, Sparkles, Tag, Trash2, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { allProducts, Product } from '@/data/catalog';

export function CartContent() {
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal } = useCart();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialCoupon = searchParams.get('coupon') || '';

  const [promoCode, setPromoCode] = useState(initialCoupon);
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(allProducts);

  const validateAndApplyCode = useCallback(
    async (codeToApply: string, productsList: Product[]) => {
      setPromoError('');
      setPromoSuccess('');

      const cleanCode = codeToApply.trim().toUpperCase();
      if (!cleanCode) {
        setPromoError('Please enter a coupon code.');
        return;
      }

      // 1. Try server-side validation against coupons database (/api/coupons/validate)
      try {
        const res = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cleanCode, subtotal }),
        });
        const result = await res.json();

        if (result.valid) {
          setDiscount(result.discount || 0);
          setAppliedPromo(cleanCode);
          setPromoSuccess(
            result.message ||
              `Coupon ${cleanCode} applied! (Saved ₹${(result.discount || 0).toLocaleString('en-IN')})`
          );
          return;
        } else if (result.message && !result.message.startsWith('Invalid or expired')) {
          setPromoError(result.message);
          return;
        }
      } catch {}

      // 2. Check Storewide promo codes
      if (cleanCode === 'ALZAIR10' || cleanCode === 'SYAB10' || cleanCode === 'WELCOME10') {
        const disc = Math.round(subtotal * 0.1);
        setDiscount(disc);
        setAppliedPromo(cleanCode);
        setPromoSuccess(`Promo code ${cleanCode} applied! (10% OFF - Saved ₹${disc.toLocaleString('en-IN')})`);
        return;
      } else if (cleanCode === 'FIRST50') {
        const disc = Math.min(subtotal, 50);
        setDiscount(disc);
        setAppliedPromo(cleanCode);
        setPromoSuccess(`Promo code FIRST50 applied! (Saved ₹50)`);
        return;
      } else if (cleanCode === 'RAMADAN20') {
        const disc = Math.round(subtotal * 0.2);
        setDiscount(disc);
        setAppliedPromo(cleanCode);
        setPromoSuccess(`Special RAMADAN20 applied! (20% OFF - Saved ₹${disc.toLocaleString('en-IN')})`);
        return;
      }

      // 3. Check Product-specific coupon codes added by Admin or in Catalog
      const pool = productsList && productsList.length > 0 ? productsList : allProducts;
      const matchingProduct = pool.find(
        (p) =>
          (p.couponCode && p.couponCode.trim().toUpperCase() === cleanCode) ||
          (p.couponDiscount && p.couponDiscount.trim().toUpperCase() === cleanCode)
      );

      if (matchingProduct) {
        let disc = 0;
        const discountStr = matchingProduct.couponDiscount || '';

        const percentMatch = discountStr.match(/(\d+)%/);
        const flatMatch = discountStr.match(/₹?\s*(\d+)/);

        if (percentMatch) {
          const percent = parseInt(percentMatch[1], 10);
          disc = Math.round(subtotal * (percent / 100));
        } else if (flatMatch && !discountStr.includes('%')) {
          const flat = parseInt(flatMatch[1], 10);
          disc = Math.min(subtotal, flat);
        } else {
          disc = Math.round(subtotal * 0.15); // default 15% for custom codes
        }

        setDiscount(disc);
        setAppliedPromo(cleanCode);
        setPromoSuccess(
          `Coupon code ${cleanCode} applied for ${matchingProduct.name}! (Saved ₹${disc.toLocaleString('en-IN')})`
        );
        return;
      }

      // 4. Dynamic percentage detection if coupon ends in numbers e.g. SAFAWI15 -> 15%
      const numberMatch = cleanCode.match(/(\d{1,2})$/);
      if (numberMatch) {
        const percent = parseInt(numberMatch[1], 10);
        if (percent > 0 && percent <= 50) {
          const disc = Math.round(subtotal * (percent / 100));
          setDiscount(disc);
          setAppliedPromo(cleanCode);
          setPromoSuccess(`Coupon ${cleanCode} applied! (${percent}% OFF - Saved ₹${disc.toLocaleString('en-IN')})`);
          return;
        }
      }

      setPromoError('Invalid or expired coupon code. Try SAFAWI15, ALZAIR10, RAMADAN20 or FIRST50');
    },
    [subtotal]
  );

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((json) => {
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : allProducts;
        setCatalogProducts(list);
        if (initialCoupon) {
          validateAndApplyCode(initialCoupon, list);
        }
      })
      .catch(() => {
        if (initialCoupon) {
          validateAndApplyCode(initialCoupon, allProducts);
        }
      });
  }, [initialCoupon, validateAndApplyCode]);

  const shipping = 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndApplyCode(promoCode, catalogProducts);
  };

  // 1. AUTHENTICATION PROTECTION CHECK
  if (authLoading) {
    return (
      <section className="bg-[#f5f0e7] px-5 py-24 text-center">
        <div className="mx-auto max-w-md">
          <div className="h-10 w-10 border-3 border-[#c49a4a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-sans text-[#786e60] tracking-wide">Checking customer session...</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="bg-[#f5f0e7] px-5 py-16 sm:py-24 text-[#171513]">
        <div className="mx-auto max-w-[720px]">
          <div className="rounded-2xl border border-[#dccbb4] bg-[#ede5d8]/85 p-8 sm:p-14 text-center shadow-[0_12px_40px_rgba(72,53,35,0.08)]">
            {/* Lock Icon in Arabian Badge */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#c49a4a] bg-[#171513] text-[#d6b15e] shadow-lg">
              <Lock size={28} />
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-[.25em] text-[#a9823b] font-sans">
              Customer Authentication Required
            </span>

            <h2 className="mt-2 text-2xl sm:text-3xl font-serif font-medium text-[#1a1714]">
              Sign In to Access Your Cart
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-[#5e5850] font-sans max-w-md mx-auto">
              To secure your order, manage saved addresses, and apply exclusive coupon discounts, please sign in or create an account.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-sm mx-auto font-sans">
              <Link
                href="/login?redirect=/cart"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#b89047] py-3.5 px-6 text-xs font-bold tracking-widest text-[#171513] shadow-[0_4px_16px_rgba(184,144,71,0.25)] transition duration-300 hover:bg-[#a67e35] active:scale-95"
              >
                <LogIn size={15} />
                <span>SIGN IN</span>
              </Link>
              <Link
                href="/signup?redirect=/cart"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#171513] bg-white py-3.5 px-6 text-xs font-bold tracking-widest text-[#171513] transition duration-300 hover:bg-[#171513] hover:text-[#f5f0e7] active:scale-95"
              >
                <UserPlus size={15} />
                <span>CREATE ACCOUNT</span>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-[#dccbb4]">
              <Link
                href="/products"
                className="text-xs font-semibold text-[#a9823b] hover:text-[#7d5f24] transition font-sans inline-flex items-center gap-1"
              >
                ← Continue Browsing Collections
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. EMPTY STATE
  if (cart.length === 0) {
    return (
      <section className="bg-[#f5f0e7] px-5 py-20 text-[#171513]">
        <div className="mx-auto max-w-[900px]">
          <div className="rounded-2xl border border-[#dccbb4] bg-[#ede5d8]/75 p-12 sm:p-16 text-center shadow-[0_8px_30px_rgba(72,53,35,0.06)]">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#c49a4a]/50 bg-white/70 text-[#a9823b] shadow-sm">
              <ShoppingBag size={24} strokeWidth={1.5} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1a1714] font-sans">
              Your cart is empty
            </h2>

            <p className="mt-2.5 text-sm sm:text-[15px] text-[#5e5850] font-sans max-w-md mx-auto">
              Welcome back, <span className="font-semibold text-[#1a1714]">{user.fullName}</span>! Browse our collection and find something you love.
            </p>

            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-[#b89047] px-8 py-3.5 text-xs font-bold tracking-widest text-[#171513] shadow-[0_4px_16px_rgba(184,144,71,0.25)] transition duration-300 hover:bg-[#a67e35] hover:shadow-[0_6px_22px_rgba(184,144,71,0.35)]"
              >
                START SHOPPING <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // POPULATED CART STATE
  return (
    <section className="bg-[#f5f0e7] px-5 py-16 sm:py-20 text-[#171513]">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-12 items-start">
          {/* Left: Cart Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#dccbb4] pb-4">
              <h2 className="text-lg font-bold text-[#1a1714] font-sans">
                Cart Items ({cart.length})
              </h2>
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition font-sans"
              >
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-[#ebdcca]">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#c49a4a]/40 bg-[#171512] shadow-sm">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1a1714] font-sans">
                        {item.name}
                      </h3>
                      {item.weight && (
                        <p className="text-xs text-[#5e5850] font-sans">
                          {item.weight}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-bold text-[#a9823b] font-sans">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Stepper */}
                    <div className="flex items-center rounded-lg border border-[#d5c7b3] bg-white shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 text-[#554e44] hover:text-[#1a1714] transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#1a1714]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 text-[#554e44] hover:text-[#1a1714] transition"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-bold text-[#1a1714] font-sans">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-rose-500 hover:text-rose-700 transition p-1.5"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                href="/#products"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#a9823b] hover:text-[#8a6828] transition font-sans"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Right: Order Summary Card */}
          <div className="rounded-2xl border border-[#dccbb4] bg-[#ede5d8]/80 p-7 sm:p-8 shadow-[0_10px_30px_rgba(72,53,35,0.06)]">
            <h3 className="text-xl font-bold tracking-tight text-[#1a1714] font-sans border-b border-[#ebdcca] pb-4">
              Order Summary
            </h3>

            <div className="mt-5 space-y-3.5 text-sm font-sans">
              <div className="flex justify-between text-[#5e5850]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#1a1714]">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-semibold">-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-[#5e5850]">
                <span>Shipping</span>
                <span className="font-semibold text-emerald-700">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    FREE DELIVERY
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <span>✓</span> Free standard shipping included on all products!
              </p>

              <div className="border-t border-[#ebdcca] pt-4">
                <div className="flex justify-between text-base font-bold text-[#1a1714]">
                  <span>Total Amount</span>
                  <span className="text-[#a9823b] text-lg font-bold">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Promo Code Form */}
            <form onSubmit={applyPromo} className="mt-6">
              <label className="block text-[10px] font-bold uppercase tracking-[.18em] text-[#554e44]">
                Coupon Code
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="e.g. ALZAIR10"
                  className="w-full rounded-md border border-[#d5c7b3] bg-white px-3.5 py-2 text-xs text-[#1a1714] uppercase outline-none focus:border-[#a9823b]"
                />
                <button
                  type="submit"
                  className="rounded-md bg-[#171513] px-4 py-2 text-[11px] font-bold tracking-wider text-white hover:bg-[#a9823b] transition shrink-0"
                >
                  APPLY
                </button>
              </div>
              {promoSuccess && (
                <p className="mt-1.5 text-[11px] font-medium text-emerald-700">
                  {promoSuccess}
                </p>
              )}
              {promoError && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-600">
                  {promoError}
                </p>
              )}
            </form>

            {/* Checkout Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() =>
                  alert('Thank you for choosing Alzair! Checkout gateway is initializing.')
                }
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#b89047] py-3.5 text-xs font-bold tracking-widest text-[#171513] shadow-[0_4px_16px_rgba(184,144,71,0.25)] transition duration-300 hover:bg-[#a67e35] hover:shadow-[0_6px_22px_rgba(184,144,71,0.35)] active:scale-[0.99]"
              >
                PROCEED TO CHECKOUT <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
