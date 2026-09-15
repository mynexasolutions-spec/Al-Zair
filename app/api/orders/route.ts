import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');
const COUPONS_FILE = path.join(process.cwd(), 'data', 'coupons.json');

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
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true';

    // 1. If Admin request, return all orders
    if (isAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          saveLocalOrders(data);
          return NextResponse.json({ success: true, source: 'supabase', data });
        }
      } catch {}

      const local = getLocalOrders();
      return NextResponse.json({ success: true, source: 'local', data: local });
    }

    // 2. If Customer request, get customer session
    let customerEmail = '';
    let customerId = '';

    try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('alzair_customer_session');
      if (sessionCookie?.value) {
        const user = JSON.parse(sessionCookie.value);
        customerEmail = (user.email || '').toLowerCase();
        customerId = user.id || '';
      }
    } catch {}

    if (!customerEmail) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/alzair_customer_session=([^;]+)/);
      if (match && match[1]) {
        try {
          const user = JSON.parse(decodeURIComponent(match[1]));
          customerEmail = (user.email || '').toLowerCase();
          customerId = user.id || '';
        } catch {}
      }
    }

    if (!customerEmail && !customerId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch customer's orders from Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .or(`customer_email.eq.${customerEmail},customer_id.eq.${customerId}`)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, data });
      }
    } catch {}

    const local = getLocalOrders();
    const userOrders = local.filter(
      (o) => (o.customer_email || '').toLowerCase() === customerEmail || (customerId && o.customer_id === customerId)
    );

    return NextResponse.json({ success: true, data: userOrders });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Error fetching orders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Get logged-in user if available
    let user: any = null;
    try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('alzair_customer_session');
      if (sessionCookie?.value) {
        user = JSON.parse(sessionCookie.value);
      }
    } catch {}

    if (!user) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/alzair_customer_session=([^;]+)/);
      if (match && match[1]) {
        try {
          user = JSON.parse(decodeURIComponent(match[1]));
        } catch {}
      }
    }

    const isUuid = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const orderNumber = 'ALZ-' + Math.floor(100000 + Math.random() * 900000);
    const orderId = crypto.randomUUID();

    const rawPayment = (body.paymentMethod || 'cod').toLowerCase();
    const paymentMethod = rawPayment.includes('upi') ? 'upi' : rawPayment.includes('online') || rawPayment.includes('card') ? 'online' : 'cod';
    const paymentStatus = paymentMethod === 'online' || paymentMethod === 'upi' ? 'paid' : 'pending';

    const newOrder = {
      id: orderId,
      order_number: orderNumber,
      customer_id: isUuid(user?.id) ? user.id : isUuid(body.customerId) ? body.customerId : null,
      customer_name: body.customerName || user?.fullName || 'Valued Customer',
      customer_email: (body.customerEmail || user?.email || 'customer@alzair.com').toLowerCase(),
      customer_phone: body.customerPhone || user?.phone || '+91 9999999999',
      shipping_address: body.shippingAddress || user?.address || 'Standard Address',
      city: body.city || user?.city || 'Mumbai',
      postal_code: body.postalCode || user?.postalCode || '400001',
      state: body.state || user?.state || 'Maharashtra',
      total_amount: Number(body.totalAmount) || 0,
      payment_status: paymentStatus,
      order_status: 'processing',
      payment_method: paymentMethod,
      items: Array.isArray(body.items) ? body.items : [],
      notes: body.notes || (body.couponCode ? `Coupon applied: ${body.couponCode}` : ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 2. Save to Supabase (orders + order_items relational table)
    try {
      const { error: sbErr } = await supabaseAdmin.from('orders').insert([newOrder]);
      if (sbErr) console.error('Supabase order insert error:', sbErr.message);

      if (Array.isArray(body.items) && body.items.length > 0) {
        const itemRows = body.items.map((item: any) => ({
          id: crypto.randomUUID(),
          order_id: orderId,
          product_id: String(item.id || item.productId || 'custom'),
          product_name: item.name || 'Premium Dates',
          product_image: item.image || null,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          weight: item.weight || '500g',
          total_price: (Number(item.price) || 0) * (Number(item.quantity) || 1),
          created_at: new Date().toISOString(),
        }));
        await supabaseAdmin.from('order_items').insert(itemRows);
      }
    } catch (err: any) {
      console.error('Supabase catch error:', err?.message);
    }

    // 3. Save to local orders.json
    const currentOrders = getLocalOrders();
    saveLocalOrders([newOrder, ...currentOrders]);

    // 4. If coupon was used, increment usage count
    if (body.couponCode) {
      const cleanCoupon = body.couponCode.trim().toUpperCase();
      try {
        if (fs.existsSync(COUPONS_FILE)) {
          const rawCoupons = fs.readFileSync(COUPONS_FILE, 'utf-8');
          const couponsList = JSON.parse(rawCoupons);
          const updatedCoupons = couponsList.map((c: any) =>
            c.code.toUpperCase() === cleanCoupon ? { ...c, usageCount: (c.usageCount || 0) + 1 } : c
          );
          fs.writeFileSync(COUPONS_FILE, JSON.stringify(updatedCoupons, null, 2), 'utf-8');
        }

        const { data: coupData } = await supabaseAdmin
          .from('coupons')
          .select('id, usage_count')
          .ilike('code', cleanCoupon)
          .single();

        if (coupData) {
          await supabaseAdmin
            .from('coupons')
            .update({ usage_count: (coupData.usage_count || 0) + 1 })
            .eq('id', coupData.id);
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully!',
      data: newOrder,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to place order' },
      { status: 500 }
    );
  }
}
