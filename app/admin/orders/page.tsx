'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertCircle,
  XCircle,
  Check,
  Copy,
  Printer,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  X,
  CreditCard,
  FileText,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  weight?: string;
  image?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  state: string;
  postal_code: string;
  total_amount: number;
  payment_status: 'paid' | 'pending' | 'refunded';
  order_status: 'processing' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: 'cod' | 'online' | 'upi' | 'card';
  items: OrderItem[];
  notes?: string;
  created_at: string;
  updated_at?: string;
}

const statusOptions = [
  { value: 'processing', label: 'Processing', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'confirmed', label: 'Confirmed', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { value: 'shipped', label: 'Shipped', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { value: 'delivered', label: 'Delivered', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Selected Order for Modal / Invoice
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Fetch Orders from DB
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setOrders(json.data);
      }
    } catch {
      showToast('Error loading orders from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update Order Status
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const prevOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId || o.order_number === orderId ? { ...o, order_status: newStatus as any } : o))
    );

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, orderStatus: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update');
      }
      showToast(`Order status updated to ${newStatus.toUpperCase()}`);
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.order_number === orderId)) {
        setSelectedOrder((prev) => prev ? { ...prev, order_status: newStatus as any } : null);
      }
    } catch {
      setOrders(prevOrders);
      showToast('Failed to update order status');
    }
  };

  // Update Payment Status
  const handleUpdatePayment = async (orderId: string, newPayment: string) => {
    const prevOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId || o.order_number === orderId ? { ...o, payment_status: newPayment as any } : o))
    );

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, paymentStatus: newPayment }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update');
      }
      showToast(`Payment status updated to ${newPayment.toUpperCase()}`);
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.order_number === orderId)) {
        setSelectedOrder((prev) => prev ? { ...prev, payment_status: newPayment as any } : null);
      }
    } catch {
      setOrders(prevOrders);
      showToast('Failed to update payment status');
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to permanently delete order ${orderNumber}?`)) return;

    try {
      const res = await fetch(`/api/admin/orders?id=${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId && o.order_number !== orderId));
        showToast(`Order ${orderNumber} deleted successfully`);
        if (selectedOrder?.id === orderId) {
          setIsDetailsOpen(false);
        }
      } else {
        throw new Error(json.error || 'Failed to delete');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error deleting order');
    }
  };

  // Copy Order Number
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').toLowerCase().includes(q) ||
      (o.city || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' ? true : o.order_status === statusFilter;
    const matchesPayment = paymentFilter === 'all' ? true : o.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Calculate Metrics
  const totalOrders = orders.length;
  const processingCount = orders.filter((o) => o.order_status === 'processing' || o.order_status === 'confirmed').length;
  const shippedCount = orders.filter((o) => o.order_status === 'shipped' || o.order_status === 'out_for_delivery').length;
  const deliveredCount = orders.filter((o) => o.order_status === 'delivered').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c49a4a]/20 text-[#c49a4a]">
              <ShoppingBag size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Customer Orders Hub
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-white/60">
            Real-time customer purchases, dispatch statuses, invoice generation, and database fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Orders</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-4 sm:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Total Orders</span>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-white">{totalOrders}</p>
          <span className="text-[10px] text-white/40">From DB store</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-4 sm:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/70">Processing</span>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-amber-400">{processingCount}</p>
          <span className="text-[10px] text-amber-400/50">Needs Dispatch</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-4 sm:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400/70">In Transit</span>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-indigo-400">{shippedCount}</p>
          <span className="text-[10px] text-indigo-400/50">Shipped</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-4 sm:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70">Delivered</span>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-emerald-400">{deliveredCount}</p>
          <span className="text-[10px] text-emerald-400/50">Completed</span>
        </div>

        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-[#c49a4a]/30 bg-gradient-to-b from-[#c49a4a]/15 to-[#c49a4a]/5 p-4 sm:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d6b15e]">Total Revenue</span>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-[#d6b15e]">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-white/50">Cumulative sales</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-white/10 bg-[#12110e] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by Order #, customer name, phone, email, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#171613] px-3 py-2.5 text-xs text-white outline-none focus:border-[#c49a4a]"
          >
            <option value="all">All Order Statuses</option>
            <option value="processing">Processing</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#171613] px-3 py-2.5 text-xs text-white outline-none focus:border-[#c49a4a]"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-white/10 bg-[#12110e] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/80">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] font-bold uppercase tracking-wider text-white/50">
              <tr>
                <th className="py-4 px-5">Order # / Date</th>
                <th className="py-4 px-5">Customer Details</th>
                <th className="py-4 px-5">Items Purchased</th>
                <th className="py-4 px-5">Total Amount</th>
                <th className="py-4 px-5">Payment</th>
                <th className="py-4 px-5">Fulfillment Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    <div className="h-6 w-6 border-2 border-[#c49a4a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading orders from database...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    <Package size={28} className="mx-auto mb-2 text-white/20" />
                    No customer orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCopied = copiedId === order.id;
                  const itemsList = Array.isArray(order.items) ? order.items : [];
                  const currentStatus = statusOptions.find((s) => s.value === order.order_status) || statusOptions[0];

                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition">
                      {/* Order Number */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#d6b15e] bg-[#c49a4a]/10 px-2 py-0.5 rounded border border-[#c49a4a]/20">
                            {order.order_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(order.order_number, order.id)}
                            title="Copy Order Number"
                            className="text-white/40 hover:text-white p-0.5"
                          >
                            {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          </button>
                        </div>
                        <span className="text-[11px] text-white/40 block mt-1">
                          {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Customer Details */}
                      <td className="py-4 px-5">
                        <p className="font-bold text-white text-xs">{order.customer_name}</p>
                        <p className="text-[11px] text-white/60 flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-[#c49a4a]" />
                          <span>{order.customer_phone || 'No phone'}</span>
                        </p>
                        <p className="text-[10px] text-white/40 line-clamp-1">
                          {order.city}, {order.state}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-5 max-w-[200px]">
                        {itemsList.length > 0 ? (
                          <div className="space-y-1">
                            {itemsList.slice(0, 2).map((item, idx) => (
                              <p key={idx} className="text-[11px] text-white/80 truncate">
                                • {item.name} <span className="text-white/40">x{item.quantity}</span>
                              </p>
                            ))}
                            {itemsList.length > 2 && (
                              <span className="text-[10px] text-[#c49a4a]">+{itemsList.length - 2} more items</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/40 text-[11px]">1 Item</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-4 px-5">
                        <span className="font-serif text-sm font-bold text-[#d6b15e]">
                          ₹{Number(order.total_amount).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                              order.payment_status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {order.payment_status || 'PENDING'}
                          </span>
                          <span className="block text-[10px] text-white/50 uppercase">
                            {order.payment_method === 'cod' ? 'COD' : 'Prepaid'}
                          </span>
                        </div>
                      </td>

                      {/* Status Action Dropdown */}
                      <td className="py-4 px-5">
                        <select
                          value={order.order_status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-bold outline-none cursor-pointer ${currentStatus.color} bg-[#171613]`}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-[#171613] text-white">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
                            title="View Full Order Details"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsInvoiceOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-[#c49a4a] hover:bg-[#c49a4a]/10 transition"
                            title="Print Invoice"
                          >
                            <Printer size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id, order.order_number)}
                            className="rounded-lg p-1.5 text-rose-400/70 hover:bg-rose-500/10 hover:text-rose-400 transition"
                            title="Delete Order"
                          >
                            <Trash2 size={15} />
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

      {/* ==================== ORDER DETAILS MODAL ==================== */}
      {isDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-[#14120e] p-6 sm:p-8 shadow-2xl my-8 text-white">
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c49a4a]/20 text-[#c49a4a]">
                  <Package size={20} />
                </span>
                <div>
                  <h3 className="text-lg font-bold">
                    Order Details #{selectedOrder.order_number}
                  </h3>
                  <p className="text-xs text-white/50">
                    Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="rounded-xl p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="mt-6 space-y-6">
              {/* Customer & Shipping Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#c49a4a]">
                    Customer Information
                  </span>
                  <p className="text-sm font-bold text-white">{selectedOrder.customer_name}</p>
                  <p className="text-xs text-white/70 flex items-center gap-1.5">
                    <Mail size={12} className="text-[#c49a4a]" />
                    <span>{selectedOrder.customer_email}</span>
                  </p>
                  <p className="text-xs text-white/70 flex items-center gap-1.5">
                    <Phone size={12} className="text-[#c49a4a]" />
                    <span>{selectedOrder.customer_phone}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#c49a4a]">
                    Shipping Destination
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {selectedOrder.shipping_address}
                  </p>
                  <p className="text-xs text-white/60">
                    {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.postal_code}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c49a4a] block mb-3">
                  Purchased Items ({Array.isArray(selectedOrder.items) ? selectedOrder.items.length : 0})
                </span>
                <div className="divide-y divide-white/5">
                  {Array.isArray(selectedOrder.items) &&
                    selectedOrder.items.map((item, i) => (
                      <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white">{item.name}</p>
                            <p className="text-[11px] text-white/50">{item.weight || '500g'} • Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-bold text-[#d6b15e]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                </div>

                {/* Price Breakdown */}
                <div className="mt-4 border-t border-white/10 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-white/60">
                    <span>Shipping Fee</span>
                    <span className="text-emerald-400 font-bold">FREE DELIVERY</span>
                  </div>
                  {selectedOrder.notes && (
                    <div className="flex justify-between text-white/60">
                      <span>Notes</span>
                      <span className="text-white/80">{selectedOrder.notes}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                    <span>Grand Total:</span>
                    <span className="text-base text-[#d6b15e]">₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Update Fulfillment Status
                  </label>
                  <select
                    value={selectedOrder.order_status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white outline-none focus:border-[#c49a4a]"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#171613]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Update Payment Status
                  </label>
                  <select
                    value={selectedOrder.payment_status}
                    onChange={(e) => handleUpdatePayment(selectedOrder.id, e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white outline-none focus:border-[#c49a4a]"
                  >
                    <option value="paid" className="bg-[#171613]">Paid (Prepaid / Received)</option>
                    <option value="pending" className="bg-[#171613]">Pending (Cash on Delivery)</option>
                    <option value="refunded" className="bg-[#171613]">Refunded</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.order_number)}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 transition"
              >
                Delete Order
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setIsInvoiceOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-[#c49a4a] px-4 py-2 text-xs font-bold text-[#d6b15e] hover:bg-[#c49a4a]/10 transition"
                >
                  <Printer size={14} />
                  <span>Print Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="rounded-xl bg-white/10 px-5 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRINTABLE INVOICE MODAL ==================== */}
      {isInvoiceOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl my-8 text-[#1a1714]">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-6">
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1a1714]">AL ZAIR</h2>
                <p className="text-xs text-[#786e60]">Luxury Arabian Gourmet Dates & Dry Fruits</p>
                <p className="text-xs text-[#786e60] mt-1">support@alzair.com • www.alzair.com</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-[#a9823b] block">TAX INVOICE / RECEIPT</span>
                <p className="font-mono text-sm font-bold mt-1">{selectedOrder.order_number}</p>
                <p className="text-[11px] text-[#786e60]">
                  {new Date(selectedOrder.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Billed to */}
            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <div>
                <span className="font-bold text-[#786e60] uppercase tracking-wider block mb-1">Customer Details</span>
                <p className="font-bold text-sm">{selectedOrder.customer_name}</p>
                <p>{selectedOrder.customer_phone}</p>
                <p>{selectedOrder.customer_email}</p>
              </div>
              <div>
                <span className="font-bold text-[#786e60] uppercase tracking-wider block mb-1">Delivery Address</span>
                <p>{selectedOrder.shipping_address}</p>
                <p>{selectedOrder.city}, {selectedOrder.state} - {selectedOrder.postal_code}</p>
                <p className="font-semibold text-emerald-800 uppercase mt-1">Payment: {selectedOrder.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid Online'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-t border-b py-3 my-2">
              <table className="w-full text-xs text-left">
                <thead className="border-b text-[10px] font-bold uppercase text-[#786e60]">
                  <tr>
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.isArray(selectedOrder.items) &&
                    selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-medium">{item.name} ({item.weight || '500g'})</td>
                        <td className="py-2.5 text-center">{item.quantity}</td>
                        <td className="py-2.5 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 text-right font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end pt-2 text-xs">
              <div className="w-48 space-y-1.5">
                <div className="flex justify-between text-[#786e60]">
                  <span>Shipping:</span>
                  <span className="text-emerald-700 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2 text-[#1a1714]">
                  <span>Total Payable:</span>
                  <span className="text-[#a9823b]">₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsInvoiceOpen(false)}
                className="rounded-xl border border-gray-300 px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-[#171513] px-6 py-2 text-xs font-bold text-white hover:bg-[#a9823b] transition shadow-md"
              >
                <Printer size={14} />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#c49a4a] px-4 py-3 text-xs font-bold text-[#12100d] shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5">
          <Check size={16} />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
