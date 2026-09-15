import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { allProducts, Product } from '@/data/catalog';

export const dynamic = 'force-dynamic';

const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json');

function getLocalProducts(): Product[] | null {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

function saveLocalProducts(products: Product[]) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch {}
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('id');

    // 1. Try Supabase
    let query = supabaseAdmin.from('products').select('*');
    if (productId) {
      query = query.eq('id', productId);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      const formatted: Product[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        productType: item.product_type || item.productType || 'Premium Dates',
        price: Number(item.price),
        originalPrice: item.original_price ? Number(item.original_price) : undefined,
        discount: item.discount,
        rating: Number(item.rating) || 4.8,
        reviews: Number(item.reviews) || 50,
        image: item.image,
        galleryImages: item.gallery_images || item.galleryImages || [],
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
      }));


      if (productId) {
        return NextResponse.json({ success: true, source: 'supabase', data: formatted[0] });
      }

      saveLocalProducts(formatted);
      return NextResponse.json({ success: true, source: 'supabase', data: formatted });
    }

    // 2. Try Local File
    const local = getLocalProducts();
    if (local) {
      if (productId) {
        const found = local.find((p) => p.id === productId || p.id.toLowerCase() === productId.toLowerCase());
        if (found) return NextResponse.json({ success: true, source: 'local_file', data: found });
      } else {
        return NextResponse.json({ success: true, source: 'local_file', data: local });
      }
    }

    // 3. Fallback to catalog
    if (productId) {
      const found = allProducts.find((p) => p.id === productId || p.id.toLowerCase() === productId.toLowerCase());
      if (found) return NextResponse.json({ success: true, source: 'default_catalog', data: found });
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, source: 'default_catalog', data: allProducts });
  } catch (err: any) {
    const local = getLocalProducts();
    return NextResponse.json({
      success: true,
      source: 'fallback',
      data: local || allProducts,
    });
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

    // Clean gallery images array
    const galleryImages: string[] = Array.isArray(body.galleryImages)
      ? body.galleryImages.filter((img: string) => img && typeof img === 'string' && img.trim())
      : [];

    const product: Product = {
      id,
      name: body.name,
      category: body.category || 'Dates',
      productType: body.productType || 'Premium Dates',
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      discount: body.discount || undefined,
      rating: Number(body.rating) || 4.8,
      reviews: Number(body.reviews) || 50,
      image: body.image || (galleryImages[0] || '/images/dates.jpg'),
      galleryImages: galleryImages.length > 0 ? galleryImages : [body.image || '/images/dates.jpg'],
      inStock: Boolean(body.inStock !== false),
      weight: body.weight || '500g',
      isNew: Boolean(body.isNew),
      salesCount: Number(body.salesCount) || 0,
      shortDescription: body.shortDescription || '',
      description: body.description || '',
      ingredients: body.ingredients || '',
      storage: body.storage || '',
      shipping: body.shipping || '',
      couponCode: body.couponCode || '',
      couponDiscount: body.couponDiscount || '',
    };

    // 1. Save to local products store
    const currentList = getLocalProducts() || allProducts;
    const updatedList = [product, ...currentList.filter((p) => p.id !== id)];
    saveLocalProducts(updatedList);

    // 2. Save to Supabase (with graceful column fallback)
    let supabaseSaved = false;
    try {
      const dbRecord: any = {
        id: product.id,
        name: product.name,
        category: product.category,
        product_type: product.productType,
        price: product.price,
        original_price: product.originalPrice || null,
        discount: product.discount || null,
        rating: product.rating,
        reviews: product.reviews,
        image: product.image,
        gallery_images: product.galleryImages,
        in_stock: product.inStock,
        weight: product.weight,
        short_description: product.shortDescription,
        description: product.description,
        ingredients: product.ingredients,
        storage: product.storage,
        shipping: product.shipping,
        coupon_code: product.couponCode || null,
        coupon_discount: product.couponDiscount || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin
        .from('products')
        .upsert(dbRecord, { onConflict: 'id' });

      if (!error) {
        supabaseSaved = true;
      } else {
        // Retry without extra columns if not yet in schema
        delete dbRecord.gallery_images;
        delete dbRecord.coupon_code;
        delete dbRecord.coupon_discount;
        const { error: retryErr } = await supabaseAdmin
          .from('products')
          .upsert(dbRecord, { onConflict: 'id' });
        if (!retryErr) supabaseSaved = true;
      }
    } catch {}

    try {
      revalidatePath('/products');
      revalidatePath(`/products/${id}`);
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      supabaseSaved,
      data: product,
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

    const currentList = getLocalProducts() || allProducts;
    const existing = currentList.find((p) => p.id === id);

    const galleryImages: string[] = Array.isArray(body.galleryImages)
      ? body.galleryImages.filter((img: string) => img && typeof img === 'string' && img.trim())
      : (existing?.galleryImages || []);

    const updatedProduct: Product = {
      ...(existing || { id, name: body.name, price: Number(body.price), image: '/images/dates.jpg', inStock: true, rating: 4.8, reviews: 50 }),
      ...body,
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      galleryImages: galleryImages.length > 0 ? galleryImages : [body.image || existing?.image || '/images/dates.jpg'],
      couponCode: body.couponCode !== undefined ? body.couponCode : existing?.couponCode,
      couponDiscount: body.couponDiscount !== undefined ? body.couponDiscount : existing?.couponDiscount,
    };

    const updatedList = currentList.map((p) => (p.id === id ? updatedProduct : p));
    saveLocalProducts(updatedList);

    try {
      const dbRecord: any = {
        name: updatedProduct.name,
        category: updatedProduct.category,
        product_type: updatedProduct.productType,
        price: updatedProduct.price,
        original_price: updatedProduct.originalPrice || null,
        discount: updatedProduct.discount || null,
        image: updatedProduct.image,
        gallery_images: updatedProduct.galleryImages,
        in_stock: updatedProduct.inStock,
        weight: updatedProduct.weight,
        short_description: updatedProduct.shortDescription,
        description: updatedProduct.description,
        ingredients: updatedProduct.ingredients,
        storage: updatedProduct.storage,
        shipping: updatedProduct.shipping,
        coupon_code: updatedProduct.couponCode || null,
        coupon_discount: updatedProduct.couponDiscount || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin
        .from('products')
        .update(dbRecord)
        .eq('id', id);

      if (error) {
        delete dbRecord.gallery_images;
        delete dbRecord.coupon_code;
        delete dbRecord.coupon_discount;
        await supabaseAdmin.from('products').update(dbRecord).eq('id', id);
      }
    } catch {}


    try {
      revalidatePath('/products');
      revalidatePath(`/products/${id}`);
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, data: updatedProduct });
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

    const currentList = getLocalProducts() || allProducts;
    const updatedList = currentList.filter((p) => p.id !== id);
    saveLocalProducts(updatedList);

    try {
      await supabaseAdmin.from('products').delete().eq('id', id);
    } catch {}

    try {
      revalidatePath('/products');
      revalidatePath(`/products/${id}`);
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: `Product ${id} deleted` });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
