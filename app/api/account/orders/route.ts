import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('alzair_customer_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    const userEmail = (user.email || '').toLowerCase();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .or(`customer_email.eq.${userEmail},customer_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, source: 'supabase', data: data || [] });
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

    const isUuid = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const orderNumber = `ALZ-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = crypto.randomUUID();

    const rawPayment = (body.paymentMethod || 'cod').toLowerCase();
    const paymentMethod = rawPayment.includes('upi') ? 'upi' : rawPayment.includes('online') || rawPayment.includes('card') ? 'online' : 'cod';
    const paymentStatus = paymentMethod === 'online' || paymentMethod === 'upi' ? 'paid' : (body.paymentStatus || 'pending');

    const newOrder = {
      id: orderId,
      order_number: orderNumber,
      customer_id: isUuid(user?.id) ? user.id : null,
      customer_name: body.customerName || user?.fullName || 'Valued Customer',
      customer_email: (user?.email || 'customer@alzair.com').toLowerCase(),
      customer_phone: body.customerPhone || user?.phone || '+91 9999999999',
      shipping_address: body.shippingAddress || user?.address || 'Default Address',
      city: body.city || user?.city || 'Mumbai',
      postal_code: body.postalCode || user?.postalCode || '400001',
      state: body.state || user?.state || 'Maharashtra',
      total_amount: Number(body.totalAmount) || 1299,
      payment_status: paymentStatus,
      order_status: body.orderStatus || 'processing',
      payment_method: paymentMethod,
      items: body.items || [{ name: 'Ajwa Royal Dates (500g)', price: 850, quantity: 1 }],
      notes: body.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: sbErr } = await supabaseAdmin.from('orders').insert([newOrder]);
    if (sbErr) {
      return NextResponse.json({ success: false, message: sbErr.message }, { status: 500 });
    }

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

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('orders').delete().eq('id', orderId);
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
