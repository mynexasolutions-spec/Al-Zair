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

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Supabase customers table first
    let foundUser: any = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (!error && data && data.password === password) {
        foundUser = {
          id: data.id,
          email: data.email,
          fullName: data.full_name || data.fullName || 'Customer',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          postalCode: data.postal_code || data.postalCode || '',
          state: data.state || '',
          createdAt: data.created_at,
        };
      }
    } catch {}

    // 2. Fallback to local customers store
    if (!foundUser) {
      const local = getLocalCustomers();
      const localMatch = local.find(
        (c) => (c.email || '').toLowerCase() === cleanEmail && c.password === password
      );

      if (localMatch) {
        foundUser = {
          id: localMatch.id,
          email: localMatch.email,
          fullName: localMatch.fullName || localMatch.full_name || 'Customer',
          phone: localMatch.phone || '',
          address: localMatch.address || '',
          city: localMatch.city || '',
          postalCode: localMatch.postalCode || localMatch.postal_code || '',
          state: localMatch.state || '',
          createdAt: localMatch.created_at,
        };
      }
    }

    if (!foundUser) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password. Please check and try again.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: foundUser,
    });

    // Set customer auth cookie
    response.cookies.set('alzair_customer_session', JSON.stringify(foundUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Login failed' },
      { status: 500 }
    );
  }
}
