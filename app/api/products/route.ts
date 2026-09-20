import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Product } from '@/data/catalog';

export const dynamic = 'force-dynamic';

function mapDbProduct(item: any): Product {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    productType: item.product_type || item.productType || 'Premium Dates',
    price: Number(item.price),
    originalPrice: item.original_price ? Number(item.original_price) : undefined,
    discount: item.discount || undefined,
    rating: Number(item.rating) || 4.8,
    reviews: Number(item.reviews) || 50,
    image: item.image,
    galleryImages: item.gallery_images || item.galleryImages || [item.image],
    inStock: Boolean(item.in_stock !== false),
    weight: item.weight || '500g',
    isNew: Boolean(item.is_new),
    salesCount: Number(item.sales_count) || 0,
    shortDescription: item.short_description || '',
    description: item.description || '',
    ingredients: item.ingredients || '',
    storage: item.storage || '',
    shipping: item.shipping || '',
    couponCode: item.coupon_code || item.couponCode || '',
    couponDiscount: item.coupon_discount || item.couponDiscount || '',
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('id');

    let query = supabaseAdmin.from('products').select('*');
    if (productId) {
      query = query.eq('id', productId);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (productId) {
      if (!data || data.length === 0) {
        return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, source: 'supabase', data: mapDbProduct(data[0]) });
    }

    const formatted: Product[] = (data || []).map(mapDbProduct);
    return NextResponse.json({ success: true, source: 'supabase', data: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const id =
      body.id ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') ||
      Date.now().toString();

    const galleryImages: string[] = Array.isArray(body.galleryImages)
      ? body.galleryImages.filter((img: string) => img && typeof img === 'string' && img.trim())
      : [];

    const mainImage = body.image || galleryImages[0] || '';

    const dbRecord: any = {
      id,
      name: body.name,
      category: body.category || 'Dates',
      product_type: body.productType || 'Premium Dates',
      price: Number(body.price),
      original_price: body.originalPrice ? Number(body.originalPrice) : null,
      discount: body.discount || null,
      rating: Number(body.rating) || 4.8,
      reviews: Number(body.reviews) || 50,
      image: mainImage,
      gallery_images: galleryImages.length > 0 ? galleryImages : (mainImage ? [mainImage] : []),
      in_stock: Boolean(body.inStock !== false),
      weight: body.weight || '500g',
      is_new: Boolean(body.isNew),
      sales_count: Number(body.salesCount) || 0,
      short_description: body.shortDescription || '',
      description: body.description || '',
      ingredients: body.ingredients || '',
      storage: body.storage || '',
      shipping: body.shipping || '',
      coupon_code: body.couponCode || null,
      coupon_discount: body.couponDiscount || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('products')
      .upsert(dbRecord, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      // Retry without extra optional columns if schema differs
      const fallbackRecord = { ...dbRecord };
      delete fallbackRecord.gallery_images;
      delete fallbackRecord.coupon_code;
      delete fallbackRecord.coupon_discount;

      const { data: retryData, error: retryErr } = await supabaseAdmin
        .from('products')
        .upsert(fallbackRecord, { onConflict: 'id' })
        .select()
        .single();

      if (retryErr) {
        return NextResponse.json({ success: false, error: retryErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Product created successfully',
        data: mapDbProduct(retryData || fallbackRecord),
      });
    }

    try {
      revalidatePath('/products');
      revalidatePath(`/products/${id}`);
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: mapDbProduct(data || dbRecord),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const galleryImages: string[] = Array.isArray(body.galleryImages)
      ? body.galleryImages.filter((img: string) => img && typeof img === 'string' && img.trim())
      : [];

    const dbRecord: any = {
      name: body.name,
      category: body.category,
      product_type: body.productType,
      price: Number(body.price),
      original_price: body.originalPrice ? Number(body.originalPrice) : null,
      discount: body.discount || null,
      image: body.image,
      gallery_images: galleryImages.length > 0
        ? Array.from(new Set([body.image || '', ...galleryImages].filter(Boolean)))
        : (body.image ? [body.image] : undefined),
      in_stock: body.inStock !== undefined ? Boolean(body.inStock) : undefined,
      weight: body.weight,
      short_description: body.shortDescription,
      description: body.description,
      ingredients: body.ingredients,
      storage: body.storage,
      shipping: body.shipping,
      coupon_code: body.couponCode || null,
      coupon_discount: body.couponDiscount || null,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(dbRecord).forEach((key) => dbRecord[key] === undefined && delete dbRecord[key]);

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(dbRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      delete dbRecord.gallery_images;
      delete dbRecord.coupon_code;
      delete dbRecord.coupon_discount;

      const { data: retryData, error: retryErr } = await supabaseAdmin
        .from('products')
        .update(dbRecord)
        .eq('id', id)
        .select()
        .single();

      if (retryErr) {
        return NextResponse.json({ success: false, error: retryErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: mapDbProduct(retryData || { id, ...dbRecord }) });
    }

    try {
      revalidatePath('/products');
      revalidatePath(`/products/${id}`);
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, data: mapDbProduct(data || { id, ...dbRecord }) });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/products');
      revalidatePath(`/products/${id}`);
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: `Product ${id} deleted successfully` });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
