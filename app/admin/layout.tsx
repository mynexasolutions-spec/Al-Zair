'use client';

import {
  Boxes,
  ExternalLink,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  MailCheck,
  Menu,
  ShoppingBag,
  TicketPercent,
  UserCheck,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (isLoginPage) {
      setCheckingAuth(false);
      return;
    }

    // Verify session via custom API & localStorage
    const verifySession = async () => {
      try {
        const localSession =
          typeof window !== 'undefined'
            ? localStorage.getItem('alzair_admin_session') || localStorage.getItem('syab_admin_session')
            : null;

        if (localSession) {
          const parsed = JSON.parse(localSession);
          setAdminEmail(parsed.email || 'admin@alzair.com');
          setCheckingAuth(false);
          return;
        }

        const res = await fetch('/api/admin/auth/me');
        const data = await res.json();

        if (res.ok && data.authenticated && data.user) {
          setAdminEmail(data.user.email);
          setCheckingAuth(false);
        } else {
          router.push('/admin/login');
        }
      } catch {
        router.push('/admin/login');
      }
    };

    verifySession();
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('alzair_admin_session');
      localStorage.removeItem('syab_admin_session');
      window.location.href = '/admin/login';
    } else {
      router.push('/admin/login');
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0d0c0a] flex items-center justify-center text-[#d6b15e]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d6b15e] border-t-transparent" />
          <span className="text-xs uppercase tracking-widest text-white/60">Verifying Admin Access...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Home Page', href: '/admin/home', icon: Home },
    { label: 'Products', href: '/admin/products', icon: Boxes },
    { label: 'Coupons', href: '/admin/coupons', icon: TicketPercent },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Gallery', href: '/admin/gallery', icon: ImageIcon },
    { label: 'Inquiries', href: '/admin/messages', icon: Mail },
    { label: 'Newsletter', href: '/admin/newsletter', icon: MailCheck },
  ];

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-white flex font-sans">
      {/* ==================== DESKTOP SIDEBAR ==================== */}
      <aside className="hidden lg:flex lg:w-64 flex-col justify-between border-r border-white/10 bg-[#0a0908] p-5">
        <div>
          {/* Logo */}
          <div className="pb-6 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="Al Zair"
                width={280}
                height={90}
                className="h-14 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              />
            </Link>
            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#c49a4a]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Admin Control Panel</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                    isActive
                      ? 'bg-[#c49a4a] text-[#12100d] shadow-md shadow-[#c49a4a]/20'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-white/10 pt-4 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-white/60 hover:bg-white/5 hover:text-white transition"
          >
            <span className="flex items-center gap-2.5">
              <ExternalLink size={14} className="text-[#c49a4a]" />
              <span>Live Storefront</span>
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition text-left"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT WRAPPER ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-white/10 bg-[#0d0c0a]/90 px-5 flex items-center justify-between backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white/80 hover:text-white"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-bold text-white capitalize hidden sm:block">
              {pathname === '/admin' ? 'Overview' : pathname.replace('/admin/', '').replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80">
              <UserCheck size={14} className="text-[#c49a4a]" />
              <span className="font-medium text-[11px] truncate max-w-[150px] sm:max-w-none">
                {adminEmail}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="lg:hidden text-rose-400 hover:text-rose-300 p-1"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative z-10 w-64 bg-[#0a0908] p-5 flex flex-col justify-between h-full border-r border-white/10">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <Image
                    src="/images/logo.png"
                    alt="Al Zair"
                    width={180}
                    height={60}
                    className="h-10 w-auto object-contain"
                  />
                  <button onClick={() => setSidebarOpen(false)} className="text-white/60">
                    <X size={18} />
                  </button>
                </div>

                <nav className="mt-6 space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                          isActive
                            ? 'bg-[#c49a4a] text-[#12100d]'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-white/10 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-5 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
