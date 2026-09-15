import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

const COUPONS_FILE = path.join(process.cwd(), 'data', 'coupons.json');

function getLocalCoupons(): Coupon[] {
  try {
    if (fs.existsSync(COUPONS_FILE)) {
      const raw = fs.readFileSync(COUPONS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalCoupons(coupons: Coupon[]) {
  try {
    fs.writeFileSync(COUPONS_FILE, JSON.stringify(coupons, null, 2), 'utf-8');
  } catch {}
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    // 1. Try Supabase
    try {
      let query = supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false });
      if (code) {
        query = query.ilike('code', code.trim());
      }
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const formatted: Coupon[] = data.map((item: any) => ({
          id: item.id,
          code: item.code,
          discountType: item.discount_type || 'percentage',
          discountValue: Number(item.discount_value) || 0,
          minOrderAmount: Number(item.min_order_amount) || 0,
          maxDiscount: item.max_discount ? Number(item.max_discount) : null,
          expiresAt: item.expires_at || null,
          usageLimit: item.usage_limit ? Number(item.usage_limit) : null,
          usageCount: Number(item.usage_count) || 0,
          isActive: Boolean(item.is_active !== false),
          description: item.description || '',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        saveLocalCoupons(formatted);
        return NextResponse.json({ success: true, source: 'supabase', data: formatted });
      }
    } catch {}

    // 2. Fallback to local store
    const local = getLocalCoupons();
    if (code) {
      const match = local.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
      return NextResponse.json({ success: true, source: 'local', data: match ? [match] : [] });
    }

    return NextResponse.json({ success: true, source: 'local', data: local });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.code || !body.discountValue) {
      return NextResponse.json(
        { success: false, error: 'Coupon code and discount value are required' },
        { status: 400 }
      );
    }

    const cleanCode = body.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const id = body.id || 'coup_' + cleanCode.toLowerCase() + '_' + Date.now().toString(36);

    const newCoupon: Coupon = {
      id,
      code: cleanCode,
      discountType: body.discountType === 'flat' ? 'flat' : 'percentage',
      discountValue: Number(body.discountValue) || 0,
      minOrderAmount: Number(body.minOrderAmount) || 0,
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      expiresAt: body.expiresAt || null,
      usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
      usageCount: 0,
      isActive: body.isActive !== false,
      description: body.description ? body.description.trim() : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to local JSON
    const currentList = getLocalCoupons();
    const exists = currentList.some((c) => c.code.toUpperCase() === cleanCode);
    if (exists) {
      return NextResponse.json(
        { success: false, error: `Coupon code "${cleanCode}" already exists` },
        { status: 400 }
      );
    }

    const updatedList = [newCoupon, ...currentList];
    saveLocalCoupons(updatedList);

    // 2. Save to Supabase
    try {
      const dbRow: any = {
        id: newCoupon.id,
        code: newCoupon.code,
        discount_type: newCoupon.discountType,
        discount_value: newCoupon.discountValue,
        min_order_amount: newCoupon.minOrderAmount,
        max_discount: newCoupon.maxDiscount,
        expires_at: newCoupon.expiresAt,
        usage_limit: newCoupon.usageLimit,
        usage_count: newCoupon.usageCount,
        is_active: newCoupon.isActive,
        description: newCoupon.description,
        created_at: newCoupon.createdAt,
        updated_at: newCoupon.updatedAt,
      };

      await supabaseAdmin.from('coupons').upsert(dbRow, { onConflict: 'id' });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully!`,
      data: newCoupon,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create coupon' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Coupon ID is required' }, { status: 400 });
    }

    const currentList = getLocalCoupons();
    const existing = currentList.find((c) => c.id === id);

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    const cleanCode = body.code ? body.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : existing.code;

    const updatedCoupon: Coupon = {
      ...existing,
      ...body,
      code: cleanCode,
      discountType: body.discountType === 'flat' ? 'flat' : (body.discountType === 'percentage' ? 'percentage' : existing.discountType),
      discountValue: body.discountValue !== undefined ? Number(body.discountValue) : existing.discountValue,
      minOrderAmount: body.minOrderAmount !== undefined ? Number(body.minOrderAmount) : existing.minOrderAmount,
      maxDiscount: body.maxDiscount !== undefined ? (body.maxDiscount ? Number(body.maxDiscount) : null) : existing.maxDiscount,
      expiresAt: body.expiresAt !== undefined ? body.expiresAt : existing.expiresAt,
      usageLimit: body.usageLimit !== undefined ? (body.usageLimit ? Number(body.usageLimit) : null) : existing.usageLimit,
      usageCount: body.usageCount !== undefined ? Number(body.usageCount) : existing.usageCount,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      description: body.description !== undefined ? body.description.trim() : existing.description,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = currentList.map((c) => (c.id === id ? updatedCoupon : c));
    saveLocalCoupons(updatedList);

    // Update Supabase
    try {
      const dbRow: any = {
        code: updatedCoupon.code,
        discount_type: updatedCoupon.discountType,
        discount_value: updatedCoupon.discountValue,
        min_order_amount: updatedCoupon.minOrderAmount,
        max_discount: updatedCoupon.maxDiscount,
        expires_at: updatedCoupon.expiresAt,
        usage_limit: updatedCoupon.usageLimit,
        usage_count: updatedCoupon.usageCount,
        is_active: updatedCoupon.isActive,
        description: updatedCoupon.description,
        updated_at: updatedCoupon.updatedAt,
      };

      await supabaseAdmin.from('coupons').update(dbRow).eq('id', id);
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Coupon "${cleanCode}" updated successfully!`,
      data: updatedCoupon,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Coupon ID is required' }, { status: 400 });
    }

    const currentList = getLocalCoupons();
    const updatedList = currentList.filter((c) => c.id !== id);
    saveLocalCoupons(updatedList);

    try {
      await supabaseAdmin.from('coupons').delete().eq('id', id);
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
