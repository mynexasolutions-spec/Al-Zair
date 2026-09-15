'use client';

import {
  CheckCircle2,
  Clock,
  Edit2,
  Heart,
  LogOut,
  MapPin,
  Package,
  Save,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

function AccountContent() {
  const router = useRouter();
  const { user, loading, logout, updateProfile } = useAuth();
  const { totalItems } = useCart();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'address'>('profile');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/account/orders');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
      }
    } catch {}
    setOrdersLoading(false);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/account');
    } else if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        postalCode: user.postalCode || '',
      });
      loadOrders();
    }
  }, [user, loading, router]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile(formData);
    setSaving(false);
    if (res.success) {
      setEditing(false);
      showToast('Profile & Address details saved to database successfully!');
    } else {
      showToast(res.message || 'Failed to save');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await fetch(`/api/account/orders?id=${orderId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast('Order removed from database');
        loadOrders();
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e7] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#c49a4a] border-r-transparent" />
          <p className="mt-3 text-xs font-semibold text-[#5e5850]">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f5f0e7] text-[#171513] font-sans">
      <Header />

      {/* Hero Banner */}
      <section className="hero-texture bg-[#0d0d0b] px-5 pt-36 pb-16 sm:pt-44 sm:pb-20 text-white font-sans">
        <div className="mx-auto max-w-[1240px] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c49a4a] text-[#12100d] font-serif text-2xl font-bold shadow-lg shadow-[#c49a4a]/20">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[.25em] text-[#a9823b]">
                Customer Account
              </span>
              <h1 className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome back, {user.fullName || 'Valued Customer'}
              </h1>
              <p className="mt-1 text-xs text-white/60 font-mono">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <ShoppingBag size={15} />
              <span>Cart ({totalItems})</span>
            </Link>

            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/30 px-4 py-2.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/30"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-[1240px]">
          {/* Toast Notification */}
          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#c49a4a] bg-[#171513] px-5 py-3.5 text-xs font-bold text-[#d6b15e] shadow-2xl animate-in slide-in-from-bottom">
              {toastMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
            {/* Sidebar Navigation */}
            <aside className="rounded-2xl border border-[#dccbb4] bg-[#ede5d8]/80 p-5 shadow-sm space-y-1.5">
              {[
                { id: 'profile', label: 'Personal Information', icon: User },
                { id: 'orders', label: 'My Order History', icon: Package },
                { id: 'address', label: 'Delivery Address', icon: MapPin },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition text-left ${
                      isActive
                        ? 'bg-[#171513] text-[#d6b15e] shadow-sm'
                        : 'text-[#554e44] hover:bg-[#ede5d8] hover:text-[#1a1714]'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-[#c49a4a]' : 'text-[#8c7e6c]'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </aside>

            {/* Tab Details */}
            <div className="rounded-2xl border border-[#dccbb4] bg-[#ede5d8]/85 p-6 sm:p-8 shadow-sm">
              {/* Profile & Address Form */}
              {(activeTab === 'profile' || activeTab === 'address') && (
                <div>
                  <div className="flex items-center justify-between border-b border-[#dccbb4] pb-4 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-[#1a1714]">
                        {activeTab === 'profile' ? 'Profile Details' : 'Shipping Address'}
                      </h2>
                      <p className="text-xs text-[#5e5850] mt-0.5">
                        Manage your contact details and default delivery address for seamless checkout.
                      </p>
                    </div>

                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#c49a4a] bg-white/70 px-3.5 py-1.5 text-xs font-bold text-[#8a6828] hover:bg-[#c49a4a] hover:text-[#12100d] transition shadow-sm"
                      >
                        <Edit2 size={13} />
                        <span>Edit Details</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditing(false)}
                        className="rounded-xl border border-[#d5c7b3] px-3.5 py-1.5 text-xs font-semibold text-[#5e5850] hover:bg-white/60 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          disabled={!editing}
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full rounded-xl border border-[#d5c7b3] bg-white p-3 text-xs text-[#1a1714] disabled:bg-[#f3ede3] disabled:text-[#6e665c] outline-none focus:border-[#a9823b]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1.5">
                          Email Address (Fixed)
                        </label>
                        <input
                          type="email"
                          disabled
                          value={user.email}
                          className="w-full rounded-xl border border-[#d5c7b3] bg-[#f3ede3] p-3 text-xs text-[#6e665c] font-mono outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          disabled={!editing}
                          placeholder="+91 9876543210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full rounded-xl border border-[#d5c7b3] bg-white p-3 text-xs text-[#1a1714] disabled:bg-[#f3ede3] disabled:text-[#6e665c] outline-none focus:border-[#a9823b]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1.5">
                          Postal / PIN Code
                        </label>
                        <input
                          type="text"
                          disabled={!editing}
                          placeholder="e.g. 110076"
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          className="w-full rounded-xl border border-[#d5c7b3] bg-white p-3 text-xs text-[#1a1714] disabled:bg-[#f3ede3] disabled:text-[#6e665c] outline-none focus:border-[#a9823b]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1.5">
                          Street / Shipping Address
                        </label>
                        <input
                          type="text"
                          disabled={!editing}
                          placeholder="House / Flat No., Street, Landmark"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full rounded-xl border border-[#d5c7b3] bg-white p-3 text-xs text-[#1a1714] disabled:bg-[#f3ede3] disabled:text-[#6e665c] outline-none focus:border-[#a9823b]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1.5">
                          City
                        </label>
                        <input
                          type="text"
                          disabled={!editing}
                          placeholder="e.g. New Delhi"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full rounded-xl border border-[#d5c7b3] bg-white p-3 text-xs text-[#1a1714] disabled:bg-[#f3ede3] disabled:text-[#6e665c] outline-none focus:border-[#a9823b]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1.5">
                          State
                        </label>
                        <input
                          type="text"
                          disabled={!editing}
                          placeholder="e.g. Delhi"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full rounded-xl border border-[#d5c7b3] bg-white p-3 text-xs text-[#1a1714] disabled:bg-[#f3ede3] disabled:text-[#6e665c] outline-none focus:border-[#a9823b]"
                        />
                      </div>
                    </div>

                    {editing && (
                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#b89047] px-6 py-3 text-xs font-bold tracking-wider text-[#171513] shadow-md transition hover:bg-[#a67e35] disabled:opacity-50"
                        >
                          <Save size={15} />
                          <span>{saving ? 'SAVING CHANGES...' : 'SAVE CHANGES'}</span>
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Orders History Tab */}
              {activeTab === 'orders' && (
                <div>
                  <div className="border-b border-[#dccbb4] pb-4 mb-6">
                    <h2 className="text-lg font-bold text-[#1a1714]">Order History</h2>
                    <p className="text-xs text-[#5e5850] mt-0.5">
                      Track your recent deliveries, view receipts, and order dates from the database.
                    </p>
                  </div>

                  {ordersLoading ? (
                    <div className="py-12 text-center text-xs font-semibold text-[#8c7e6c]">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#c49a4a] border-r-transparent mb-2" />
                      <p>Loading your orders from database...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-12 text-center rounded-xl border border-dashed border-[#dccbb4] bg-white/50 p-8">
                      <Package size={32} className="mx-auto text-[#c49a4a] opacity-60 mb-2" />
                      <p className="text-sm font-bold text-[#1a1714]">No orders placed yet</p>
                      <p className="text-xs text-[#786e60] mt-1 max-w-sm mx-auto">
                        Your completed purchases and deliveries will appear here automatically.
                      </p>
                      <div className="mt-4 flex items-center justify-center">
                        <Link
                          href="/products"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#b89047] px-5 py-2.5 text-xs font-bold text-[#171513] shadow-sm hover:bg-[#a67e35] transition"
                        >
                          Shop Luxury Dates
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const itemsText = Array.isArray(order.items)
                          ? order.items.map((i: any) => `${i.name || i.product_name} (x${i.quantity || 1})`).join(', ')
                          : typeof order.items === 'string'
                          ? order.items
                          : 'Premium Dates Assortment';

                        const isProcessing = (order.order_status || order.status) === 'processing' || (order.order_status || order.status) === 'pending';

                        return (
                          <div
                            key={order.id || order.order_number}
                            className="rounded-xl border border-[#d5c7b3] bg-white p-5 shadow-sm transition hover:border-[#c49a4a]"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ebdcca] pb-3 mb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono font-bold text-xs text-[#1a1714]">
                                  {order.order_number || order.id}
                                </span>
                                <span className="text-[11px] text-[#786e60]">
                                  • {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                    (order.order_status || order.status) === 'delivered'
                                      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                                      : 'bg-amber-500/15 text-amber-800 border-amber-500/30'
                                  }`}
                                >
                                  <CheckCircle2 size={11} className="mr-1" />
                                  {(order.order_status || order.status || 'processing').toUpperCase()}
                                </span>

                                {isProcessing && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline transition"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div className="space-y-0.5">
                                <p className="text-[#554e44] font-medium">{itemsText}</p>
                                <p className="text-[11px] text-[#8c7e6c]">
                                  Ship to: {order.shipping_address || 'Registered Address'}, {order.city || ''} {order.postal_code || ''}
                                </p>
                              </div>
                              <p className="text-sm font-bold text-[#1a1714] shrink-0">
                                Total: <span className="text-[#a9823b]">₹{Number(order.total_amount || order.total || 0).toLocaleString('en-IN')}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f0e7] flex items-center justify-center font-sans">Loading account...</div>}>
      <AccountContent />
    </Suspense>
  );
}
