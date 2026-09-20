import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    const cleanEmail = (email || '').trim().toLowerCase();

    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Check existing subscriber in Supabase
    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "You're already subscribed to our newsletter!",
        alreadySubscribed: true,
      });
    }

    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .insert([{ email: cleanEmail, created_at: new Date().toISOString() }]);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing to Alzair newsletter!',
      alreadySubscribed: false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Subscription failed. Please try again.' },
      { status: 500 }
    );
  }
}
