'use client';

import { ArrowRight, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    const res = await signup(formData);
    setLoading(false);

    if (res.success) {
      router.push(redirectUrl);
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f0e7] px-5 py-12 text-[#171513] font-sans">
      <div className="w-full max-w-md">
        {/* Brand Logo Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block transition-transform duration-300 hover:scale-105">
            <div className="relative h-16 w-44 mx-auto">
              <Image
                src="/images/logo.png"
                alt="Alzair Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-[#dccbb4] bg-[#ede5d8]/85 p-8 sm:p-10 shadow-[0_16px_40px_rgba(72,53,35,0.08)] backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#171513] text-[#c49a4a] mb-3 shadow-md">
              <User size={20} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1714]">
              Create Account
            </h1>
            <p className="mt-1 text-xs text-[#5e5850]">
              Join Alzair to shop premium dates, save cart items &amp; track orders
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7e6c]" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-xl border border-[#d5c7b3] bg-white py-3 pl-10 pr-4 text-xs text-[#1a1714] placeholder:text-[#8c7e6c]/60 outline-none focus:border-[#a9823b] shadow-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7e6c]" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-[#d5c7b3] bg-white py-3 pl-10 pr-4 text-xs text-[#1a1714] placeholder:text-[#8c7e6c]/60 outline-none focus:border-[#a9823b] shadow-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7e6c]" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full rounded-xl border border-[#d5c7b3] bg-white py-3 pl-10 pr-4 text-xs text-[#1a1714] placeholder:text-[#8c7e6c]/60 outline-none focus:border-[#a9823b] shadow-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#554e44] mb-1.5">
                Password * (Min 6 chars)
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7e6c]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#d5c7b3] bg-white py-3 pl-10 pr-4 text-xs text-[#1a1714] placeholder:text-[#8c7e6c]/60 outline-none focus:border-[#a9823b] shadow-sm transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#b89047] py-3.5 text-xs font-bold tracking-widest text-[#171513] shadow-md transition duration-300 hover:bg-[#a67e35] active:scale-95 disabled:opacity-50"
            >
              {loading ? 'CREATING ACCOUNT...' : 'REGISTER & CONTINUE'} <ArrowRight size={14} />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#dccbb4] text-center text-xs text-[#5e5850]">
            <span>Already have an account? </span>
            <Link
              href={`/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="font-bold text-[#a9823b] hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Return to Home Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-[#8c7e6c] hover:text-[#1a1714] transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f0e7] flex items-center justify-center">Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
