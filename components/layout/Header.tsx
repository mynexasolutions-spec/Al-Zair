'use client';

import {
  ChevronDown,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  User,
  UserRound,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { LiveSearchModal } from '@/components/search/LiveSearchModal';

const defaultCategories = [
  'Dates',
  'Dates Laddu',
  'Stuffed Dates',
  'Date Bites',
  'Gift Packs',
];

export function Header() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { user, logout } = useAuth();

  const isAbout = pathname === '/about' || pathname === '/about-us';
  const isContact = pathname === '/contact' || pathname === '/contact-us';
  const isGallery = pathname === '/gallery';
  const isProducts = pathname === '/products';
  const isHome = !isAbout && !isContact && !isGallery && !isProducts && pathname !== '/cart';

  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [open, setOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data);
        }
      } catch {}
    }
    loadCategories();
  }, []);

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-black/20 text-white backdrop-blur-[2px] font-sans">
        <div className="mx-auto flex h-[90px] sm:h-[100px] lg:h-[108px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center py-1" aria-label="Al Zair home">
            <Image
              src="/images/logo.png"
              alt="Al Zair"
              width={360}
              height={120}
              className="h-14 sm:h-18 lg:h-20 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-105"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 text-[15px] font-medium tracking-wide lg:flex">
            <Link
              href="/"
              className={`transition-colors ${
                isHome ? 'text-[#d6b15e] hover:text-[#e4c274]' : 'text-white/90 hover:text-[#d6b15e]'
              }`}
            >
              Home
            </Link>

            {/* Products Dropdown (Desktop) */}
            <div className="group relative py-4">
              <Link
                href="/products"
                className={`flex items-center gap-1.5 transition-colors ${
                  isProducts ? 'text-[#d6b15e] hover:text-[#e4c274]' : 'text-white/90 hover:text-[#d6b15e]'
                }`}
              >
                Products
                <ChevronDown size={14} className="text-[#c49a4a] transition-transform duration-200 group-hover:rotate-180" />
              </Link>

              {/* Dropdown Menu */}
              <div className="invisible absolute left-0 top-full -mt-1 w-52 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 z-50">
                <div className="rounded-lg border border-[#c49a4a]/40 bg-[#0d0d0b]/95 p-2.5 shadow-2xl backdrop-blur-md">
                  <Link
                    href="/products"
                    className="block rounded-md px-3 py-2 text-xs sm:text-[13px] font-bold text-white/95 transition-colors hover:bg-[#c49a4a]/15 hover:text-[#d6b15e]"
                  >
                    All Products
                  </Link>
                  <div className="my-1 border-t border-white/10" />
                  {categories.map((item) => (
                    <Link
                      key={item}
                      href={`/products?category=${encodeURIComponent(item)}`}
                      className="block rounded-md px-3 py-1.5 text-xs sm:text-[13px] text-white/85 transition-colors hover:bg-[#c49a4a]/15 hover:text-[#d6b15e]"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/about"
              className={`transition-colors ${
                isAbout ? 'text-[#d6b15e] hover:text-[#e4c274]' : 'text-white/90 hover:text-[#d6b15e]'
              }`}
            >
              About Us
            </Link>
            <Link
              href="/gallery"
              className={`transition-colors ${
                isGallery ? 'text-[#d6b15e] hover:text-[#e4c274]' : 'text-white/90 hover:text-[#d6b15e]'
              }`}
            >
              Gallery
            </Link>
            <Link
              href="/contact"
              className={`transition-colors ${
                isContact ? 'text-[#d6b15e] hover:text-[#e4c274]' : 'text-white/90 hover:text-[#d6b15e]'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Live Search Trigger */}
            <button
              aria-label="Open search modal"
              onClick={() => setSearchOpen(true)}
              className="text-white/90 transition-colors hover:text-[#d6b15e]"
            >
              <Search size={17} />
            </button>

            {/* Customer Account Avatar / Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 rounded-full border border-[#c49a4a]/50 bg-black/40 px-2.5 py-1 text-xs font-semibold text-[#d6b15e] transition hover:border-[#c49a4a]"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c49a4a] text-[10px] font-bold text-[#12100d]">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                  </span>
                  <span className="hidden sm:inline max-w-[80px] truncate">{user.fullName.split(' ')[0]}</span>
                  <ChevronDown size={12} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[#c49a4a]/40 bg-[#0d0d0b] p-2 shadow-2xl z-50 text-xs">
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="font-bold text-white truncate">{user.fullName}</p>
                      <p className="text-[10px] text-white/50 truncate font-mono">{user.email}</p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-[#d6b15e] transition mt-1"
                    >
                      <User size={13} />
                      <span>My Account</span>
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-[#d6b15e] transition"
                    >
                      <ShoppingBag size={13} />
                      <span>My Cart ({totalItems})</span>
                    </Link>
                    <div className="my-1 border-t border-white/10" />
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                aria-label="Account Login"
                className="hidden text-white/90 transition-colors hover:text-[#d6b15e] sm:flex items-center gap-1 text-xs font-semibold"
              >
                <UserRound size={16} />
                <span>Sign In</span>
              </Link>
            )}

            {/* Shopping Cart Button */}
            <Link
              href="/cart"
              aria-label="Shopping Cart"
              className="relative text-white/90 transition-colors hover:text-[#d6b15e]"
            >
              <ShoppingBag size={17} />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#b89047] text-[9px] font-bold text-[#171513] shadow-sm animate-in zoom-in-75">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              aria-label="Open menu"
              className="text-white/90 transition-colors hover:text-[#d6b15e] lg:hidden"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu with Products Dropdown */}
        {open && (
          <nav className="border-t border-white/10 bg-[#0d0d0b]/98 px-6 py-5 lg:hidden backdrop-blur-md">
            <div className="flex flex-col gap-4 text-[15px] font-medium">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={`transition-colors ${
                  isHome ? 'text-[#d6b15e]' : 'text-white/90 hover:text-[#d6b15e]'
                }`}
              >
                Home
              </Link>

              {/* Mobile Products Dropdown Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                  className={`flex w-full items-center justify-between py-1 text-left transition-colors ${
                    isProducts ? 'text-[#d6b15e]' : 'text-white/90 hover:text-[#d6b15e]'
                  }`}
                >
                  <span>Products</span>
                  <ChevronDown
                    size={16}
                    className={`text-[#c49a4a] transition-transform duration-200 ${
                      mobileProductsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {mobileProductsOpen && (
                  <div className="mt-2.5 flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 pl-4 pr-3 text-sm">
                    <Link
                      href="/products"
                      onClick={() => {
                        setMobileProductsOpen(false);
                        setOpen(false);
                      }}
                      className="py-1 font-bold text-white/95 transition-colors hover:text-[#d6b15e]"
                    >
                      All Products
                    </Link>
                    <div className="my-0.5 border-t border-white/10" />
                    {categories.map((cat) => (
                      <Link
                        key={cat}
                        href={`/products?category=${encodeURIComponent(cat)}`}
                        onClick={() => {
                          setMobileProductsOpen(false);
                          setOpen(false);
                        }}
                        className="py-1 text-white/80 transition-colors hover:text-[#d6b15e]"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className={`transition-colors ${
                  isAbout ? 'text-[#d6b15e]' : 'text-white/90 hover:text-[#d6b15e]'
                }`}
              >
                About Us
              </Link>

              <Link
                href="/gallery"
                onClick={() => setOpen(false)}
                className={`transition-colors ${
                  isGallery ? 'text-[#d6b15e]' : 'text-white/90 hover:text-[#d6b15e]'
                }`}
              >
                Gallery
              </Link>

              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className={`transition-colors ${
                  isContact ? 'text-[#d6b15e]' : 'text-white/90 hover:text-[#d6b15e]'
                }`}
              >
                Contact
              </Link>

              {user ? (
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="py-1 text-[#d6b15e] font-bold"
                >
                  My Account ({user.fullName.split(' ')[0]})
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="py-1 text-[#d6b15e] font-bold"
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Real-Time Live Search Modal */}
      <LiveSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

