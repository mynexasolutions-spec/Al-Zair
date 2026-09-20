import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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

    // Query Supabase customers table
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error || !data || data.password !== password) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password. Please check and try again.' },
        { status: 401 }
      );
    }

    const foundUser = {
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
