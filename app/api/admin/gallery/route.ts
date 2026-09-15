import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { galleryImages as defaultGalleryImages } from '@/data/products';

export const dynamic = 'force-dynamic';

const GALLERY_FILE = path.join(process.cwd(), 'data', 'gallery.json');

function getLocalGallery(): any[] {
  try {
    if (fs.existsSync(GALLERY_FILE)) {
      const raw = fs.readFileSync(GALLERY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to read gallery.json:', err);
  }
  return defaultGalleryImages.map((item, idx) => ({
    id: `gal_default_${idx + 1}`,
    image: item.image,
    alt: item.alt,
    category: item.category || 'Products',
  }));
}

function saveLocalGallery(images: any[]) {
  try {
    fs.writeFileSync(GALLERY_FILE, JSON.stringify(images, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write gallery.json:', err);
  }
}

export async function GET() {
  try {
    // 1. Try Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        saveLocalGallery(data);
        return NextResponse.json({ success: true, source: 'supabase', data });
      }
    } catch (dbErr) {
      console.warn('Supabase gallery query note:', dbErr);
    }

    // 2. Fallback to local gallery.json / defaults
    const local = getLocalGallery();
    return NextResponse.json({ success: true, source: 'local_file', data: local });
  } catch (err: any) {
    const fallback = getLocalGallery();
    return NextResponse.json({ success: true, source: 'fallback', data: fallback });
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

    // 1. Save to local JSON
    const current = getLocalGallery();
    const updated = [newItem, ...current];
    saveLocalGallery(updated);

    // 2. Save to Supabase (if table exists)
    let supabaseSaved = false;
    try {
      const { error } = await supabaseAdmin.from('gallery').insert([newItem]);
      if (!error) supabaseSaved = true;
    } catch (dbErr) {
      console.warn('Supabase gallery insert note:', dbErr);
    }

    // 3. Revalidate frontend paths
    try {
      revalidatePath('/gallery');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Gallery image added successfully',
      supabaseSaved,
      data: newItem,
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

    // 1. Update in local JSON
    const current = getLocalGallery();
    const updated = current.map((item) =>
      item.id === id
        ? {
            ...item,
            ...(image ? { image: image.trim() } : {}),
            ...(alt !== undefined ? { alt: alt.trim() } : {}),
            ...(category ? { category: category.trim() } : {}),
            updated_at: new Date().toISOString(),
          }
        : item
    );
    saveLocalGallery(updated);

    // 2. Update in Supabase
    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      if (image) dbUpdates.image = image.trim();
      if (alt !== undefined) dbUpdates.alt = alt.trim();
      if (category) dbUpdates.category = category.trim();

      await supabaseAdmin.from('gallery').update(dbUpdates).eq('id', id);
    } catch (dbErr) {
      console.warn('Supabase gallery update note:', dbErr);
    }

    // 3. Revalidate frontend paths
    try {
      revalidatePath('/gallery');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Gallery image updated successfully' });
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

    // 1. Delete from local JSON
    const current = getLocalGallery();
    const updated = current.filter((item) => item.id !== id);
    saveLocalGallery(updated);

    // 2. Delete from Supabase
    try {
      await supabaseAdmin.from('gallery').delete().eq('id', id);
    } catch (dbErr) {
      console.warn('Supabase gallery delete note:', dbErr);
    }

    // 3. Revalidate frontend paths
    try {
      revalidatePath('/gallery');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Gallery image deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Failed to delete image' }, { status: 500 });
  }
}

