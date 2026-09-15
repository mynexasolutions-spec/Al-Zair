'use client';

import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Lock,
  LogIn,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  User,
  UserPlus,
  X,
} from 'lucide-react';
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

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Checkout Form Data
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    paymentMethod: 'cod' as 'cod' | 'online',
    notes: '',
  });

  // Populate user data when available
  useEffect(() => {
    if (user) {
      setShippingForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
        address: prev.address || user.address || '',
        city: prev.city || user.city || 'Mumbai',
        state: prev.state || user.state || 'Maharashtra',
        postalCode: prev.postalCode || user.postalCode || '400001',
      }));
    }
  }, [user]);

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

      setPromoError('Invalid or expired coupon code. Try SAFAWI15, RAMADAN20, ALZAIR10 or FIRST50');
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

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (!shippingForm.fullName && user?.fullName) {
      setShippingForm((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || '',
        city: user.city || 'Mumbai',
        state: user.state || 'Maharashtra',
        postalCode: user.postalCode || '400001',
      }));
    }
    setIsCheckoutOpen(true);
  };

  // Place Order API handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shippingForm.fullName.trim() || !shippingForm.phone.trim() || !shippingForm.address.trim()) {
      alert('Please fill in your Full Name, Phone Number, and Delivery Address.');
      return;
    }

    setPlacingOrder(true);
    try {
      const payload = {
        customerName: shippingForm.fullName.trim(),
        customerEmail: shippingForm.email.trim() || user?.email || 'customer@alzair.com',
        customerPhone: shippingForm.phone.trim(),
        shippingAddress: shippingForm.address.trim(),
        city: shippingForm.city.trim(),
        state: shippingForm.state.trim(),
        postalCode: shippingForm.postalCode.trim(),
        paymentMethod: shippingForm.paymentMethod,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          weight: item.weight,
          quantity: item.quantity,
          image: item.image,
        })),
        totalAmount: total,
        subtotal: subtotal,
        discount: discount,
        couponCode: appliedPromo,
        notes: shippingForm.notes.trim(),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setOrderSuccess(json.data);
        clearCart();
        setIsCheckoutOpen(false);
      } else {
        throw new Error(json.message || 'Failed to place order');
      }
    } catch (err: any) {
      alert(err?.message || 'Error processing order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
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
      <section className="bg-[#f5f0e7] px-5 py-20 sm:py-28 font-sans text-[#171513]">
        <div className="mx-auto max-w-lg rounded-3xl border border-[#dccbb4] bg-[#fdfbf7] p-8 sm:p-12 shadow-[0_20px_50px_rgba(72,53,35,0.08)] text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c49a4a]/50 bg-[#ede5d8] text-[#8a6828] shadow-sm">
            <Lock size={28} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[.25em] text-[#a9823b]">
            Account Access Required
          </span>
          <h2 className="mt-3 font-serif text-3xl font-medium sm:text-4xl text-[#1a1714]">
            Sign In to View Cart
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-[#786e60] leading-relaxed">
            To view your shopping bag, apply exclusive discounts, and complete your order, please log in to your Alzair account.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?redirect=/cart"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b89047] px-7 py-3.5 text-xs font-bold tracking-wider text-[#171513] transition hover:bg-[#a67e35] shadow-md"
            >
              <LogIn size={15} />
              <span>LOG IN</span>
            </Link>
            <Link
              href="/signup?redirect=/cart"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#171513] bg-transparent px-7 py-3.5 text-xs font-bold tracking-wider text-[#171513] transition hover:bg-[#171513] hover:text-white"
            >
              <UserPlus size={15} />
              <span>CREATE ACCOUNT</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // 2. ORDER PLACED SUCCESS SCREEN
  if (orderSuccess) {
    return (
      <section className="bg-[#f5f0e7] px-5 py-20 sm:py-28 font-sans">
        <div className="mx-auto max-w-2xl rounded-3xl border border-[#dccbb4] bg-[#fdfbf7] p-8 sm:p-12 shadow-[0_20px_50px_rgba(72,53,35,0.08)] text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 border-4 border-emerald-50">
            <CheckCircle2 size={42} strokeWidth={2.5} />
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-[.25em] text-[#a9823b]">
            Order Confirmed & Stored in Database
          </span>

          <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[#1a1714] font-medium">
            Thank You For Your Order!
          </h2>

          <p className="mt-2 text-sm text-[#786e60]">
            Your order has been received and dispatched to our admin fulfillment center.
          </p>

          <div className="my-6 rounded-2xl border border-[#dccbb4] bg-[#ede5d8]/60 p-5 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-[#d5c7b3] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#786e60]">Order Number</span>
                <p className="font-mono text-base font-bold text-[#1a1714]">{orderSuccess.order_number}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#786e60]">Total Amount</span>
                <p className="text-base font-bold text-[#a9823b]">₹{Number(orderSuccess.total_amount).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#554e44]">
              <div>
                <span className="font-semibold text-[#1a1714] block">Delivery Address:</span>
                <p>{orderSuccess.shipping_address}, {orderSuccess.city}, {orderSuccess.state} - {orderSuccess.postal_code}</p>
              </div>
              <div>
                <span className="font-semibold text-[#1a1714] block">Payment Method:</span>
                <p className="capitalize font-medium text-emerald-800">
                  {orderSuccess.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Online Paid / UPI'}
                </p>
                <span className="text-[11px] text-[#786e60] mt-1 block">Status: {orderSuccess.order_status?.toUpperCase() || 'PROCESSING'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/account"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#171513] px-7 py-3 text-xs font-bold text-white hover:bg-[#a9823b] transition"
            >
              <Package size={15} />
              <span>Track in My Account Orders</span>
            </Link>

            <Link
              href="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#dccbb4] bg-white px-7 py-3 text-xs font-bold text-[#1a1714] hover:bg-[#ede5d8] transition"
            >
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // 3. EMPTY CART STATE
  if (cart.length === 0) {
    return (
      <section className="bg-[#f5f0e7] px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#d5c7b3] bg-white text-[#a9823b] shadow-sm">
            <ShoppingBag size={32} />
          </div>
          <h2 className="font-serif text-3xl font-medium text-[#1a1714]">
            Your Bag is Empty
          </h2>
          <p className="mt-3 text-sm text-[#786e60] leading-relaxed font-sans">
            Looks like you haven&apos;t added any premium gourmet dates or gift boxes to your cart yet.
          </p>
          <div className="mt-8">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-[#b89047] px-8 py-3.5 text-xs font-bold tracking-widest text-[#171513] shadow-[0_4px_16px_rgba(184,144,71,0.25)] transition duration-300 hover:bg-[#a67e35] font-sans"
            >
              EXPLORE COLLECTION <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#f5f0e7] px-5 py-12 sm:py-16">
      <div className="mx-auto max-w-[1200px]">
        {/* Top Header */}
        <div className="mb-8 border-b border-[#ebdcca] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[.25em] text-[#a9823b] font-sans">
              Shopping Cart
            </span>
            <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-[#1a1714] font-medium">
              Review Your Bag ({cart.reduce((acc, i) => acc + i.quantity, 0)} Items)
            </h1>
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 transition font-sans flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Trash2 size={13} />
            <span>Clear Cart</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 xl:gap-14 items-start">
          {/* Left: Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-[#dccbb4] bg-[#fdfbf7] p-5 sm:p-7 shadow-[0_10px_30px_rgba(72,53,35,0.04)] divide-y divide-[#ebdcca]">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#d5c7b3] bg-[#171513]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-serif text-base sm:text-lg font-medium text-[#1a1714]">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#786e60] font-sans mt-0.5">
                        {item.weight || '500g pack'} • ₹{item.price.toLocaleString('en-IN')} each
                      </p>
                      <p className="mt-1 font-serif text-sm font-bold text-[#a9823b]">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <div className="flex items-center border border-[#d5c7b3] rounded-lg bg-white px-2 py-1 font-sans">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-[#786e60] hover:text-[#1a1714] transition"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#1a1714]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-[#786e60] hover:text-[#1a1714] transition"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-[#8c7e6c] hover:text-rose-600 transition"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                href="/products"
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
                  placeholder="e.g. SAFAWI15, ALZ10-VTEG"
                  className="w-full rounded-md border border-[#d5c7b3] bg-white px-3.5 py-2 text-xs text-[#1a1714] uppercase outline-none focus:border-[#a9823b] font-mono"
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
                onClick={handleOpenCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#b89047] py-3.5 text-xs font-bold tracking-widest text-[#171513] shadow-[0_4px_16px_rgba(184,144,71,0.25)] transition duration-300 hover:bg-[#a67e35] hover:shadow-[0_6px_22px_rgba(184,144,71,0.35)] active:scale-[0.99]"
              >
                PROCEED TO CHECKOUT <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== INTERACTIVE CHECKOUT MODAL ==================== */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto font-sans">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[#dccbb4] bg-[#fdfbf7] p-6 sm:p-8 shadow-2xl my-8 text-[#1a1714]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-[#d5c7b3]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b89047] text-[#171513]">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold">
                    Complete Your Order
                  </h3>
                  <p className="text-xs text-[#786e60]">
                    Enter your shipping details & select your preferred payment mode.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-xl p-1.5 text-[#786e60] hover:bg-[#ede5d8] transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePlaceOrder} className="mt-6 space-y-5">
              {/* Customer Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#554e44] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={shippingForm.fullName}
                    onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                    className="w-full rounded-xl border border-[#d5c7b3] bg-white p-3 text-xs text-[#1a1714] outline-none focus:border-[#a9823b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#554e44] mb-1">
                    Phone Number (for Courier & Tracking) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-[#d5c7b3] bg-white p-3 text-xs text-[#1a1714] outline-none focus:border-[#a9823b]"
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#554e44] mb-1">
                  Flat, House No., Building, Street Address *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Flat 402, Royal Palms, Sector 15"
                  value={shippingForm.address}
                  onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                  className="w-full rounded-xl border border-[#d5c7b3] bg-white p-3 text-xs text-[#1a1714] outline-none focus:border-[#a9823b]"
                />
              </div>

              {/* City, State, PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={shippingForm.city}
                    onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                    className="w-full rounded-xl border border-[#d5c7b3] bg-white p-2.5 text-xs text-[#1a1714] outline-none focus:border-[#a9823b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={shippingForm.state}
                    onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                    className="w-full rounded-xl border border-[#d5c7b3] bg-white p-2.5 text-xs text-[#1a1714] outline-none focus:border-[#a9823b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 400001"
                    value={shippingForm.postalCode}
                    onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                    className="w-full rounded-xl border border-[#d5c7b3] bg-white p-2.5 text-xs text-[#1a1714] outline-none focus:border-[#a9823b]"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#554e44] mb-2">
                  Payment Method
                </label>
                <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#a9823b] bg-[#ede5d8]/80 shadow-sm">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={true}
                    readOnly
                    className="accent-[#a9823b]"
                  />
                  <div>
                    <span className="block text-xs font-bold text-[#1a1714]">Cash on Delivery (COD)</span>
                    <span className="text-[11px] text-[#786e60]">Pay cash or scan QR code upon doorstep delivery</span>
                  </div>
                </div>
              </div>

              {/* Order Breakdown Snapshot */}
              <div className="rounded-2xl border border-[#dccbb4] bg-[#ede5d8]/50 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#5e5850]">
                  <span>Items ({cart.length})</span>
                  <span className="font-semibold text-[#1a1714]">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({appliedPromo || 'Coupon'})</span>
                    <span className="font-semibold">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5e5850]">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-emerald-700">FREE DELIVERY</span>
                </div>
                <div className="border-t border-[#d5c7b3] pt-2 flex justify-between text-sm font-bold text-[#1a1714]">
                  <span>Total Payable:</span>
                  <span className="text-base text-[#a9823b]">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#d5c7b3]">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="rounded-xl border border-[#d5c7b3] bg-white px-5 py-2.5 text-xs font-bold text-[#554e44] hover:bg-[#ede5d8] transition"
                >
                  Back to Bag
                </button>
                <button
                  type="submit"
                  disabled={placingOrder}
                  className="flex items-center gap-2 rounded-xl bg-[#b89047] px-7 py-2.5 text-xs font-bold text-[#171513] shadow-lg hover:bg-[#a67e35] transition disabled:opacity-50"
                >
                  {placingOrder ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Confirm & Place Order (₹{total.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
