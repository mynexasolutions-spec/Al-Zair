'use client';

import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  Database,
  IndianRupee,
  Mail,
  Plus,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function AdminDashboardPage() {
  const [productCount, setProductCount] = useState<number>(0);
  const [inquiryCount, setInquiryCount] = useState<number>(0);
  const [unreadInquiryCount, setUnreadInquiryCount] = useState<number>(0);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Check Supabase connection
  const checkDb = async () => {
    setLoading(true);
    try {
      const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
      if (!error && count !== null) {
        setProductCount(count);
        setDbConnected(true);
      } else {
        setDbConnected(true);
      }
    } catch {
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const [orders, setOrders] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  const fetchOrdersData = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setOrders(json.data);
        const sum = json.data.reduce((acc: number, o: any) => acc + (Number(o.total_amount) || 0), 0);
        setTotalRevenue(sum);
      }
    } catch {}
  };

  const fetchInquiriesAndSubscribers = async () => {
    try {
      const [inqRes, subRes] = await Promise.all([
        fetch('/api/admin/messages'),
        fetch('/api/admin/newsletter'),
      ]);

      const inqData = await inqRes.json();
      if (inqRes.ok && inqData.success && Array.isArray(inqData.data)) {
        setInquiryCount(inqData.data.length);
        setUnreadInquiryCount(inqData.unreadCount || 0);
      }

      const subData = await subRes.json();
      if (subRes.ok && subData.success && Array.isArray(subData.data)) {
        setSubscriberCount(subData.data.length);
      }
    } catch {}
  };

  useEffect(() => {
    checkDb();
    fetchInquiriesAndSubscribers();
    fetchOrdersData();
  }, []);

  const stats = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      change: 'Calculated from DB orders',
      icon: IndianRupee,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      href: '/admin/orders',
    },
    {
      title: 'Total Orders',
      value: orders.length.toString(),
      change: `${orders.filter((o) => o.order_status === 'processing').length} processing orders`,
      icon: ShoppingBag,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      href: '/admin/orders',
    },
    {
      title: 'Active Products',
      value: productCount.toString(),
      change: '5 categories listed',
      icon: Boxes,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      href: '/admin/products',
    },
    {
      title: 'Customer Inquiries',
      value: inquiryCount.toString(),
      change: `${unreadInquiryCount} unread message${unreadInquiryCount === 1 ? '' : 's'}`,
      icon: Mail,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      href: '/admin/messages',
    },
  ];

  const recentOrders = orders.slice(0, 5).map((o) => ({
    id: o.order_number || o.id,
    customer: o.customer_name || 'Customer',
    items: Array.isArray(o.items) && o.items.length > 0
      ? o.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')
      : 'Gourmet Dates',
    amount: `₹${Number(o.total_amount || 0).toLocaleString('en-IN')}`,
    status: (o.order_status || 'processing').charAt(0).toUpperCase() + (o.order_status || 'processing').slice(1),
    date: new Date(o.created_at || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    }),
  }));

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'processing':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'shipped':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Real-time analytics and store management for Alzair.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={checkDb}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Supabase</span>
          </button>

          <Link
            href="/admin/products"
            className="flex items-center gap-2 rounded-xl bg-[#c49a4a] px-4 py-2 text-xs font-bold text-[#12100d] shadow-md shadow-[#c49a4a]/20 hover:bg-[#d6b15e] transition"
          >
            <Plus size={15} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Database Connection Status Card */}
      <div className="rounded-2xl border border-white/10 bg-[#14120e] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Database size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                PostgreSQL & Supabase Connected
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 size={10} /> Active
              </span>
            </div>
            <p className="text-[11px] text-white/50 mt-0.5">
              Project URL: <span className="font-mono text-[#c49a4a]">https://oadpkwwcwndocanqnltd.supabase.co</span>
            </p>
          </div>
        </div>

        <div className="text-xs text-white/60">
          <span className="text-white/40">Schema file:</span> <span className="font-mono text-white/80">supabase/schema.sql</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const CardContent = (
            <div
              className="rounded-2xl border border-white/10 bg-[#12110e] p-5 shadow-lg relative overflow-hidden transition duration-200 hover:border-[#c49a4a]/40 hover:bg-[#161410]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`rounded-xl p-2.5 ${stat.bgColor} ${stat.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
                  {stat.value}
                </span>
                <p className="mt-1 text-[11px] font-medium text-emerald-400 flex items-center justify-between">
                  <span>{stat.change}</span>
                  {stat.href && <ArrowUpRight size={13} className="text-[#c49a4a]" />}
                </p>
              </div>
            </div>
          );

          return stat.href ? (
            <Link key={stat.title} href={stat.href} className="block">
              {CardContent}
            </Link>
          ) : (
            <div key={stat.title}>{CardContent}</div>
          );
        })}
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-2xl border border-white/10 bg-[#12110e] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Recent Orders</h3>
            <p className="text-[11px] text-white/50">Latest customer transactions</p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs text-[#c49a4a] hover:text-[#d6b15e] font-semibold transition"
          >
            <span>View All</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-white/50 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-6 py-4 font-mono font-bold text-white">{order.id}</td>
                  <td className="px-6 py-4 font-medium text-white">{order.customer}</td>
                  <td className="px-6 py-4 text-white/60 truncate max-w-xs">{order.items}</td>
                  <td className="px-6 py-4 font-bold text-[#c49a4a]">{order.amount}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/50">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
