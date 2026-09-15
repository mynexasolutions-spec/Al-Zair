'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CustomerUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: CustomerUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<CustomerUser>) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  updateProfile: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check current session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json.authenticated && json.user) {
          setUser(json.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.user) {
        setUser(json.user);
        return { success: true };
      }
      return { success: false, message: json.message || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Login failed' };
    }
  };

  const signup = async (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success && json.user) {
        setUser(json.user);
        return { success: true };
      }
      return { success: false, message: json.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    try {
      localStorage.removeItem('alzair_dates_cart');
      localStorage.removeItem('syab_dates_cart');
    } catch {}
    window.location.href = '/login';
  };

  const updateProfile = async (data: Partial<CustomerUser>) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success && json.user) {
        setUser(json.user);
        return { success: true, message: 'Profile updated successfully' };
      }
      return { success: false, message: json.message || 'Failed to update profile' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
