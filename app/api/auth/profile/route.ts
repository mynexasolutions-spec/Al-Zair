import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
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

export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('alzair_customer_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(sessionCookie.value);
    const updates = await req.json();

    const updatedUser = {
      ...currentUser,
      fullName: updates.fullName !== undefined ? updates.fullName : currentUser.fullName,
      phone: updates.phone !== undefined ? updates.phone : currentUser.phone,
      address: updates.address !== undefined ? updates.address : currentUser.address,
      city: updates.city !== undefined ? updates.city : currentUser.city,
      postalCode: updates.postalCode !== undefined ? updates.postalCode : currentUser.postalCode,
      state: updates.state !== undefined ? updates.state : currentUser.state,
      updated_at: new Date().toISOString(),
    };

    // 1. Update in local JSON
    const local = getLocalCustomers();
    const updatedList = local.map((c) =>
      c.id === currentUser.id || (c.email || '').toLowerCase() === currentUser.email.toLowerCase()
        ? { ...c, ...updatedUser }
        : c
    );
    saveLocalCustomers(updatedList);

    // 2. Update in Supabase
    try {
      await supabaseAdmin
        .from('customers')
        .update({
          full_name: updatedUser.fullName,
          phone: updatedUser.phone,
          address: updatedUser.address,
          city: updatedUser.city,
          postal_code: updatedUser.postalCode,
          state: updatedUser.state,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);
    } catch {}

    const response = NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });

    response.cookies.set('alzair_customer_session', JSON.stringify(updatedUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
