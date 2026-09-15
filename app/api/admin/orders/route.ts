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

export async function GET() {
  try {
    // 1. Try Supabase
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

    // 2. Local fallback
    const local = getLocalOrders();
    return NextResponse.json({ success: true, source: 'local', data: local });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch admin orders' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || body.orderId;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const currentOrders = getLocalOrders();
    const existing = currentOrders.find((o) => o.id === id || o.order_number === id);

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const updatedOrder = {
      ...existing,
      ...body,
      order_status: body.orderStatus || body.order_status || existing.order_status,
      payment_status: body.paymentStatus || body.payment_status || existing.payment_status,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      updated_at: new Date().toISOString(),
    };

    // 1. Update local JSON
    const updatedList = currentOrders.map((o) => (o.id === id || o.order_number === id ? updatedOrder : o));
    saveLocalOrders(updatedList);

    // 2. Update Supabase
    try {
      await supabaseAdmin
        .from('orders')
        .update({
          order_status: updatedOrder.order_status,
          payment_status: updatedOrder.payment_status,
          notes: updatedOrder.notes,
          updated_at: updatedOrder.updated_at,
        })
        .or(`id.eq.${id},order_number.eq.${id}`);
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Order ${updatedOrder.order_number} status updated to ${updatedOrder.order_status.toUpperCase()}`,
      data: updatedOrder,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const currentOrders = getLocalOrders();
    const updated = currentOrders.filter((o) => o.id !== id && o.order_number !== id);
    saveLocalOrders(updated);

    try {
      await supabaseAdmin.from('orders').delete().or(`id.eq.${id},order_number.eq.${id}`);
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}
