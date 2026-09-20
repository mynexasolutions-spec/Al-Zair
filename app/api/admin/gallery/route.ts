import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { galleryImages as defaultGalleryImages } from '@/data/products';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Auto-seed default catalog gallery images if database has no records
    if (!data || data.length === 0) {
      const defaultItems = defaultGalleryImages.map((item, idx) => ({
        id: `gal_default_${idx + 1}`,
        image: item.image,
        alt: item.alt,
        category: item.category,
        created_at: new Date(Date.now() - (idx + 1) * 60000).toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabaseAdmin.from('gallery').insert(defaultItems);

      return NextResponse.json({ success: true, source: 'supabase_seeded', data: defaultItems });
    }

    return NextResponse.json({ success: true, source: 'supabase', data: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, alt, category } = body;

    if (!image || typeof image !== 'string' || !image.trim()) {
      return NextResponse.json({ success: false, message: 'Image URL is required' }, { status: 400 });
    }

    const id = `gal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem = {
      id,
      image: image.trim(),
      alt: (alt || 'Alzair Premium Dates & Creations').trim(),
      category: (category || 'Products').trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('gallery')
      .insert([newItem])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/gallery');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Gallery image added successfully',
      data: data || newItem,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Failed to add image' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, image, alt, category } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Image ID is required' }, { status: 400 });
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };
    if (image) dbUpdates.image = image.trim();
    if (alt !== undefined) dbUpdates.alt = alt.trim();
    if (category) dbUpdates.category = category.trim();

    const { data, error } = await supabaseAdmin
      .from('gallery')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/gallery');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Gallery image updated successfully',
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Failed to update image' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Image ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('gallery').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/gallery');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Gallery image deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Failed to delete image' }, { status: 500 });
  }
}

