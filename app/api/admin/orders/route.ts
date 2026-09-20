import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, source: 'supabase', data: data || [] });
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

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.orderStatus || body.order_status) {
      updates.order_status = body.orderStatus || body.order_status;
    }
    if (body.paymentStatus || body.payment_status) {
      updates.payment_status = body.paymentStatus || body.payment_status;
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .or(`id.eq.${id},order_number.eq.${id}`)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Order ${data.order_number || id} status updated to ${(data.order_status || 'updated').toUpperCase()}`,
      data,
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

    const { error } = await supabaseAdmin.from('orders').delete().or(`id.eq.${id},order_number.eq.${id}`);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully from database',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}
