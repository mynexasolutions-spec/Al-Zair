import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('contact_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const inquiries = data || [];
    return NextResponse.json({
      success: true,
      source: 'supabase',
      data: inquiries,
      unreadCount: inquiries.filter((m: any) => m.status === 'unread').length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('contact_inquiries')
      .update({ status })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Status updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update status' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Inquiry ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('contact_inquiries').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Inquiry deleted successfully from database' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete inquiry' }, { status: 500 });
  }
}
