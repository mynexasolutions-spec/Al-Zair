import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { full_name, name, email, phone, subject, message } = body;

    const senderName = (full_name || name || '').trim();
    const senderEmail = (email || '').trim();
    const senderPhone = (phone || '').trim();
    const senderSubject = (subject || 'General Inquiry').trim();
    const senderMessage = (message || '').trim();

    if (!senderName || !senderEmail || !senderMessage) {
      return NextResponse.json(
        { success: false, error: 'Full name, email address, and message are required.' },
        { status: 400 }
      );
    }

    const newInquiry = {
      full_name: senderName,
      email: senderEmail,
      phone: senderPhone || null,
      subject: senderSubject || 'General Inquiry',
      message: senderMessage,
      status: 'unread',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('contact_inquiries')
      .insert([newInquiry])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been sent successfully.',
      data: data || newInquiry,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to submit inquiry.' },
      { status: 500 }
    );
  }
}
