'use client';

import React, { useState, useEffect } from 'react';
import {
  TicketPercent,
  Plus,
  Search,
  Check,
  Copy,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  Calendar,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Tag,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminCouponsPage() {
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'flat'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'flat',
    discountValue: 15,
    minOrderAmount: 0,
    maxDiscount: '',
    expiresAt: '',
    usageLimit: '',
    isActive: true,
    description: '',
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load Coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coupons');
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setCoupons(json.data);
      }
    } catch {
      showToast('Error loading coupons list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: generateRandomCode('ALZ'),
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 0,
      maxDiscount: '',
      expiresAt: '',
      usageLimit: '',
      isActive: true,
      description: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      isActive: coupon.isActive,
      description: coupon.description || '',
    });
    setIsModalOpen(true);
  };

  // Generate random promo codes
  function generateRandomCode(prefix = 'ALZ') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const discounts = ['10', '15', '20', '25', '50'];
    const randomDisc = discounts[Math.floor(Math.random() * discounts.length)];
    return `${prefix}${randomDisc}-${suffix}`;
  }

  const handleGenerateNewCode = () => {
    const generated = generateRandomCode('ALZ');
    setFormData((prev) => ({ ...prev, code: generated }));
    showToast(`Generated code: ${generated}`);
  };

  // Copy code to clipboard
  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    showToast(`Coupon "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle Active/Inactive
  const handleToggleStatus = async (coupon: Coupon) => {
    const newStatus = !coupon.isActive;
    // Optimistic update
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: newStatus } : c))
    );

    try {
      const res = await fetch('/api/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, isActive: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update');
      }
      showToast(`Coupon "${coupon.code}" is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}`);
    } catch {
      // Revert on error
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: coupon.isActive } : c))
      );
      showToast('Failed to update status');
    }
  };

  // Delete Coupon
  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${code}"?`)) return;

    try {
      const res = await fetch(`/api/coupons?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        showToast(`Coupon "${code}" deleted successfully`);
      } else {
        throw new Error(json.error || 'Failed to delete');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error deleting coupon');
    }
  };

  // Save Coupon (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      showToast('Please provide a valid coupon code');
      return;
    }

    if (Number(formData.discountValue) <= 0) {
      showToast('Discount value must be greater than 0');
      return;
    }

    setSaving(true);
    const cleanCode = formData.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    const payload = {
      id: editingCoupon?.id,
      code: cleanCode,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      isActive: formData.isActive,
      description: formData.description.trim(),
    };

    try {
      if (editingCoupon) {
        const res = await fetch('/api/coupons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setCoupons((prev) => prev.map((c) => (c.id === editingCoupon.id ? json.data : c)));
          showToast(`Coupon "${cleanCode}" updated successfully!`);
          setIsModalOpen(false);
        } else {
          throw new Error(json.error || 'Failed to update');
        }
      } else {
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setCoupons((prev) => [json.data, ...prev]);
          showToast(`Coupon "${cleanCode}" created successfully!`);
          setIsModalOpen(false);
        } else {
          throw new Error(json.error || 'Failed to create');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving coupon');
    } finally {
      setSaving(false);
    }
  };

  // Filtered List
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? c.isActive
        : !c.isActive;

    const matchesType =
      typeFilter === 'all' ? true : c.discountType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate Metrics
  const totalCoupons = coupons.length;
  const activeCount = coupons.filter((c) => c.isActive).length;
  const inactiveCount = totalCoupons - activeCount;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c49a4a]/20 text-[#c49a4a]">
              <TicketPercent size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Coupons & Discount Generator
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-white/60">
            Create promotional discount codes, manage seasonal campaigns, and track customer redemptions in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCoupons}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c49a4a] to-[#d6b15e] px-4 py-2.5 text-xs font-bold text-[#12100d] shadow-lg shadow-[#c49a4a]/20 hover:brightness-110 transition"
          >
            <Plus size={16} />
            <span>Generate / Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Total Coupons</span>
            <span className="rounded-lg bg-[#c49a4a]/10 p-2 text-[#c49a4a]">
              <TicketPercent size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{totalCoupons}</p>
          <span className="text-[11px] text-white/40">Stored in DB & JSON</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Active Offers</span>
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{activeCount}</p>
          <span className="text-[11px] text-emerald-400/60">Live for checkout</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Inactive / Paused</span>
            <span className="rounded-lg bg-rose-500/10 p-2 text-rose-400">
              <AlertCircle size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white/70">{inactiveCount}</p>
          <span className="text-[11px] text-white/40">Temporarily disabled</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Redemptions</span>
            <span className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Sparkles size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#d6b15e]">{totalRedemptions}</p>
          <span className="text-[11px] text-white/40">Orders with coupon</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#12110e] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search coupons by code or campaign note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-[#171613] px-3 py-2.5 text-xs text-white outline-none focus:border-[#c49a4a]"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-[#171613] px-3 py-2.5 text-xs text-white outline-none focus:border-[#c49a4a]"
          >
            <option value="all">All Discount Types</option>
            <option value="percentage">Percentage (% OFF)</option>
            <option value="flat">Flat Amount (₹ OFF)</option>
          </select>
        </div>
      </div>

      {/* Coupons Table / Grid */}
      <div className="rounded-2xl border border-white/10 bg-[#12110e] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/80">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] font-bold uppercase tracking-wider text-white/50">
              <tr>
                <th className="py-4 px-5">Coupon Code</th>
                <th className="py-4 px-5">Discount Offer</th>
                <th className="py-4 px-5">Min Spend</th>
                <th className="py-4 px-5">Expiry / Validity</th>
                <th className="py-4 px-5">Redemptions</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    <div className="h-6 w-6 border-2 border-[#c49a4a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading coupons from database...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    <Tag size={28} className="mx-auto mb-2 text-white/20" />
                    No coupons found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const isCopied = copiedId === coupon.id;
                  const isExpired =
                    coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now();

                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      {/* Code */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold tracking-wider text-[#d6b15e] bg-[#c49a4a]/10 px-2.5 py-1 rounded-lg border border-[#c49a4a]/20">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code, coupon.id)}
                            title="Copy code"
                            className="text-white/40 hover:text-[#d6b15e] transition p-1"
                          >
                            {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="mt-1 text-[11px] text-white/40 line-clamp-1 max-w-[220px]">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Offer */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                            {coupon.discountType === 'percentage' ? (
                              <>
                                <Percent size={11} />
                                <span>{coupon.discountValue}% OFF</span>
                              </>
                            ) : (
                              <>
                                <DollarSign size={11} />
                                <span>₹{coupon.discountValue} FLAT OFF</span>
                              </>
                            )}
                          </span>
                        </div>
                        {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                          <span className="mt-0.5 block text-[10px] text-white/40">
                            Max Cap: ₹{coupon.maxDiscount}
                          </span>
                        )}
                      </td>

                      {/* Min Spend */}
                      <td className="py-4 px-5">
                        {coupon.minOrderAmount > 0 ? (
                          <span className="font-medium text-white/80">
                            ₹{coupon.minOrderAmount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-white/40 text-[11px]">No Minimum</span>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="py-4 px-5">
                        {coupon.expiresAt ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className={isExpired ? 'text-rose-400' : 'text-white/40'} />
                            <span className={isExpired ? 'text-rose-400 font-medium' : 'text-white/70'}>
                              {new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {isExpired && (
                              <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold text-rose-400">
                                EXPIRED
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/40 text-[11px]">Never Expires</span>
                        )}
                      </td>

                      {/* Redemptions */}
                      <td className="py-4 px-5">
                        <span className="font-semibold text-white">
                          {coupon.usageCount || 0}
                        </span>
                        {coupon.usageLimit && (
                          <span className="text-white/40"> / {coupon.usageLimit} max</span>
                        )}
                      </td>

                      {/* Status Switch */}
                      <td className="py-4 px-5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            coupon.isActive ? 'bg-emerald-600' : 'bg-white/20'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              coupon.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(coupon)}
                            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition"
                            title="Edit Coupon"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(coupon.id, coupon.code)}
                            className="rounded-lg p-1.5 text-rose-400/70 hover:bg-rose-500/10 hover:text-rose-400 transition"
                            title="Delete Coupon"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-[#14120e] p-6 sm:p-8 shadow-2xl my-8 text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c49a4a]/20 text-[#c49a4a]">
                  <TicketPercent size={20} />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {editingCoupon ? `Edit Coupon (${editingCoupon.code})` : 'Create & Generate New Coupon'}
                  </h3>
                  <p className="text-xs text-white/50">
                    Configure coupon rules, discounts and minimum cart thresholds.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Voucher Preview */}
            <div className="mt-5 rounded-2xl border-2 border-dashed border-[#c49a4a]/60 bg-gradient-to-r from-[#c49a4a]/10 to-[#d6b15e]/5 p-4 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c49a4a] text-[#12100d]">
                    <Tag size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#d6b15e]">
                        Customer Live Preview
                      </span>
                      <span className="rounded-full bg-[#12100d] px-2 py-0.5 text-[10px] font-bold text-[#d6b15e] border border-[#c49a4a]/30">
                        {formData.discountType === 'percentage'
                          ? `${formData.discountValue}% OFF`
                          : `₹${formData.discountValue} FLAT OFF`}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 mt-0.5">
                      Use code <span className="font-mono font-bold text-[#d6b15e] bg-black/40 px-2 py-0.5 rounded border border-[#c49a4a]/40">{formData.code || 'CODE'}</span> at cart
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0 text-center">
                  {formData.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="mt-6 space-y-5">
              {/* Row 1: Code & Generator Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/80">
                    Coupon Code *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateNewCode}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#c49a4a] hover:text-[#d6b15e] transition"
                  >
                    <Sparkles size={13} />
                    <span>🎲 Auto-Generate Code</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAFAWI15, RAMADAN20, FIRST50"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-3 font-mono text-sm font-bold uppercase tracking-wider text-white outline-none focus:border-[#c49a4a]"
                />
              </div>

              {/* Row 2: Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                    Discount Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition ${
                        formData.discountType === 'percentage'
                          ? 'border-[#c49a4a] bg-[#c49a4a] text-[#12100d]'
                          : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <Percent size={13} />
                      <span>Percentage (%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: 'flat' })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition ${
                        formData.discountType === 'flat'
                          ? 'border-[#c49a4a] bg-[#c49a4a] text-[#12100d]'
                          : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <DollarSign size={13} />
                      <span>Flat (₹)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                    Discount Value {formData.discountType === 'percentage' ? '(%)' : '(₹)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'percentage' ? '100' : '99999'}
                    required
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#c49a4a]"
                  />
                </div>
              </div>

              {/* Row 3: Minimum Order & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                    Minimum Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for no minimum"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrderAmount: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#c49a4a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                    Max Discount Cap (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500 (leave blank for no limit)"
                    value={formData.maxDiscount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscount: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#c49a4a]"
                  />
                </div>
              </div>

              {/* Row 4: Expiry Date & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#c49a4a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                    Total Usage Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100 (unlimited if blank)"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLimit: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#c49a4a]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                  Campaign Description / Offer Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramadan Special 20% discount on all gourmet dates"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#c49a4a]"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5">
                <div>
                  <span className="block text-xs font-bold text-white">Enable Coupon Offer</span>
                  <span className="text-[11px] text-white/50">
                    Customers can immediately redeem this coupon at checkout.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    formData.isActive ? 'bg-emerald-600' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formData.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c49a4a] to-[#d6b15e] px-6 py-2.5 text-xs font-bold text-[#12100d] shadow-lg shadow-[#c49a4a]/20 hover:brightness-110 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving Coupon...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>{editingCoupon ? 'Update Coupon' : 'Save & Publish Coupon'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#c49a4a] px-4 py-3 text-xs font-bold text-[#12100d] shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5">
          <Check size={16} />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
