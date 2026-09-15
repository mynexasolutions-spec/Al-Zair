import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const CUSTOMERS_FILE = path.join(process.cwd(), 'data', 'customers.json');

function getLocalCustomers(): any[] {
  try {
    if (fs.existsSync(CUSTOMERS_FILE)) {
      const raw = fs.readFileSync(CUSTOMERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalCustomers(list: any[]) {
  try {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch {}
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, password, phone } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = (phone || '').trim();

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check existing customer in local or Supabase
    const localCustomers = getLocalCustomers();
    const existingLocal = localCustomers.find((c) => (c.email || '').toLowerCase() === cleanEmail);

    if (existingLocal) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCustomer = {
      id: customerId,
      full_name: cleanName,
      fullName: cleanName,
      email: cleanEmail,
      password: password, // For customer portal
      phone: cleanPhone,
      address: '',
      city: '',
      postal_code: '',
      postalCode: '',
      state: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Save to local JSON
    saveLocalCustomers([newCustomer, ...localCustomers]);

    // 2. Save to Supabase customers table (graceful if table exists)
    try {
      await supabaseAdmin.from('customers').insert([
        {
          id: customerId,
          full_name: cleanName,
          email: cleanEmail,
          password: password,
          phone: cleanPhone,
          created_at: newCustomer.created_at,
          updated_at: newCustomer.updated_at,
        },
      ]);
    } catch {}

    const sessionUser = {
      id: customerId,
      email: cleanEmail,
      fullName: cleanName,
      phone: cleanPhone,
      address: '',
      city: '',
      postalCode: '',
      state: '',
      createdAt: newCustomer.created_at,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: sessionUser,
    });

    // Set auth cookie
    response.cookies.set('alzair_customer_session', JSON.stringify(sessionUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
