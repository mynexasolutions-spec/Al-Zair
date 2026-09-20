import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { defaultHomepageContent, HomepageContent } from '@/data/homepageContent';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('homepage_content')
      .select('*')
      .eq('id', 'main_homepage')
      .single();

    if (error || !data) {
      return NextResponse.json({
        success: true,
        source: 'default_fallback',
        data: defaultHomepageContent,
      });
    }

    const content: HomepageContent = {
      hero: data.hero || defaultHomepageContent.hero,
      featured_products: data.featured_products || defaultHomepageContent.featured_products,
      testimonials: data.testimonials || defaultHomepageContent.testimonials,
      home_gallery: data.home_gallery || defaultHomepageContent.home_gallery,
    };

    return NextResponse.json({ success: true, source: 'supabase', data: content });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch homepage content' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const payload: HomepageContent = {
      hero: body.hero || defaultHomepageContent.hero,
      featured_products: body.featured_products || defaultHomepageContent.featured_products,
      testimonials: body.testimonials || defaultHomepageContent.testimonials,
      home_gallery: body.home_gallery || defaultHomepageContent.home_gallery,
    };

    const dbPayload = {
      id: 'main_homepage',
      hero: payload.hero,
      featured_products: payload.featured_products,
      testimonials: payload.testimonials,
      home_gallery: payload.home_gallery,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('homepage_content')
      .upsert(dbPayload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Homepage content saved successfully to Supabase Database',
      data: payload,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Server error updating homepage' },
      { status: 500 }
    );
  }
}
