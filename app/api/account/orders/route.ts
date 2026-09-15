import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');

function getLocalOrders(): any[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalOrders(orders: any[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch {}
}

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('alzair_customer_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    const userEmail = (user.email || '').toLowerCase();

    // 1. Try fetching from Supabase orders table
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .or(`customer_email.eq.${userEmail},customer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, data });
      }
    } catch {}

    // 2. Fallback to local store
    const local = getLocalOrders();
    const userOrders = local.filter(
      (o) => (o.customer_email || '').toLowerCase() === userEmail || o.customer_id === user.id
    );

    return NextResponse.json({ success: true, data: userOrders });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('alzair_customer_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    const body = await req.json();

    const orderNumber = `ALZ-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order_number: orderNumber,
      customer_id: user.id,
      customer_name: body.customerName || user.fullName || 'Customer',
      customer_email: user.email,
      customer_phone: body.customerPhone || user.phone || '',
      shipping_address: body.shippingAddress || user.address || 'Default Address',
      city: body.city || user.city || 'Default City',
      postal_code: body.postalCode || user.postalCode || '',
      state: body.state || user.state || '',
      total_amount: body.totalAmount || 1299,
      payment_status: body.paymentStatus || 'paid',
      order_status: body.orderStatus || 'processing',
      payment_method: body.paymentMethod || 'cod',
      items: body.items || [{ name: 'Ajwa Royal Dates (500g)', price: 850, quantity: 1 }],
      notes: body.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Save to Supabase
    try {
      await supabaseAdmin.from('orders').insert([newOrder]);
    } catch {}

    // 2. Save to local fallback
    const local = getLocalOrders();
    saveLocalOrders([newOrder, ...local]);

    return NextResponse.json({ success: true, message: 'Order created', data: newOrder });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('alzair_customer_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    // 1. Delete in Supabase
    try {
      await supabaseAdmin.from('orders').delete().eq('id', orderId);
    } catch {}

    // 2. Delete in local store
    const local = getLocalOrders();
    const updated = local.filter((o) => o.id !== orderId && o.order_number !== orderId);
    saveLocalOrders(updated);

    return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
