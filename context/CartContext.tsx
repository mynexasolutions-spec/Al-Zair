'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { useAuth } from './AuthContext';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  weight?: string;
};

type ToastState = {
  id: number;
  message: string;
  productName?: string;
  productImage?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  toasts: ToastState[];
  removeToast: (id: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync cart with user state
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCart([]);
      try {
        localStorage.removeItem('alzair_dates_cart');
        localStorage.removeItem('syab_dates_cart');
      } catch {}
      setIsInitialized(true);
      return;
    }

    try {
      const userCartKey = `alzair_dates_cart_${user.id || user.email}`;
      const savedCart =
        localStorage.getItem(userCartKey) ||
        localStorage.getItem('alzair_dates_cart') ||
        localStorage.getItem('syab_dates_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
    setIsInitialized(true);
  }, [user, authLoading]);

  // Save to localStorage on change (only for logged-in user)
  useEffect(() => {
    if (isInitialized && user) {
      try {
        const userCartKey = `alzair_dates_cart_${user.id || user.email}`;
        localStorage.setItem(userCartKey, JSON.stringify(cart));
        localStorage.setItem('alzair_dates_cart', JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to save cart to localStorage', e);
      }
    }
  }, [cart, isInitialized, user]);

  const showToast = (message: string, productName?: string, productImage?: string) => {
    const newToast: ToastState = {
      id: Date.now() + Math.random(),
      message,
      productName,
      productImage,
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(newToast.id);
    }, 3800);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>, qty = 1) => {
    if (!user) {
      showToast(`Please log in to purchase and add products to your bag.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });

    showToast(`Added to cart!`, item.name, item.image);
  };

  const removeFromCart = (id: string) => {
    const item = cart.find((i) => i.id === id);
    setCart((prev) => prev.filter((i) => i.id !== id));
    if (item) {
      showToast(`Removed from cart`, item.name);
    }
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        toasts,
        removeToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cart: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      totalItems: 0,
      subtotal: 0,
      toasts: [],
      removeToast: () => {},
    };
  }
  return context;
}
