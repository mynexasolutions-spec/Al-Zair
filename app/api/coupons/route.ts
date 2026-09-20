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

function mapDbCoupon(item: any): Coupon {
  return {
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
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    let query = supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false });
    if (code) {
      query = query.ilike('code', code.trim());
    }
    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const formatted: Coupon[] = (data || []).map(mapDbCoupon);
    return NextResponse.json({ success: true, source: 'supabase', data: formatted });
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

    const dbRow: any = {
      id,
      code: cleanCode,
      discount_type: body.discountType === 'flat' ? 'flat' : 'percentage',
      discount_value: Number(body.discountValue) || 0,
      min_order_amount: Number(body.minOrderAmount) || 0,
      max_discount: body.maxDiscount ? Number(body.maxDiscount) : null,
      expires_at: body.expiresAt || null,
      usage_limit: body.usageLimit ? Number(body.usageLimit) : null,
      usage_count: 0,
      is_active: body.isActive !== false,
      description: body.description ? body.description.trim() : '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert([dbRow])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully!`,
      data: mapDbCoupon(data || dbRow),
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

    const cleanCode = body.code ? body.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : undefined;

    const dbRow: any = {
      updated_at: new Date().toISOString(),
    };
    if (cleanCode) dbRow.code = cleanCode;
    if (body.discountType) dbRow.discount_type = body.discountType === 'flat' ? 'flat' : 'percentage';
    if (body.discountValue !== undefined) dbRow.discount_value = Number(body.discountValue);
    if (body.minOrderAmount !== undefined) dbRow.min_order_amount = Number(body.minOrderAmount);
    if (body.maxDiscount !== undefined) dbRow.max_discount = body.maxDiscount ? Number(body.maxDiscount) : null;
    if (body.expiresAt !== undefined) dbRow.expires_at = body.expiresAt || null;
    if (body.usageLimit !== undefined) dbRow.usage_limit = body.usageLimit ? Number(body.usageLimit) : null;
    if (body.usageCount !== undefined) dbRow.usage_count = Number(body.usageCount);
    if (body.isActive !== undefined) dbRow.is_active = Boolean(body.isActive);
    if (body.description !== undefined) dbRow.description = body.description.trim();

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Coupon updated successfully!`,
      data: mapDbCoupon(data || { id, ...dbRow }),
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

    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully from database',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
