import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { allProducts } from '@/data/catalog';

export const dynamic = 'force-dynamic';

const COUPONS_FILE = path.join(process.cwd(), 'data', 'coupons.json');
const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = (body.code || '').trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;

    if (!code) {
      return NextResponse.json({ valid: false, message: 'Please enter a coupon code.' }, { status: 400 });
    }

    // 1. Check in Coupons DB / JSON
    let allCoupons: any[] = [];
    try {
      const { data } = await supabaseAdmin.from('coupons').select('*');
      if (data && data.length > 0) {
        allCoupons = data.map((item: any) => ({
          id: item.id,
          code: item.code.toUpperCase(),
          discountType: item.discount_type || 'percentage',
          discountValue: Number(item.discount_value) || 0,
          minOrderAmount: Number(item.min_order_amount) || 0,
          maxDiscount: item.max_discount ? Number(item.max_discount) : null,
          expiresAt: item.expires_at || null,
          usageLimit: item.usage_limit ? Number(item.usage_limit) : null,
          usageCount: Number(item.usage_count) || 0,
          isActive: Boolean(item.is_active !== false),
          description: item.description || '',
        }));
      }
    } catch {}

    if (allCoupons.length === 0 && fs.existsSync(COUPONS_FILE)) {
      try {
        const raw = fs.readFileSync(COUPONS_FILE, 'utf-8');
        allCoupons = JSON.parse(raw);
      } catch {}
    }

    const matchedCoupon = allCoupons.find((c) => c.code.toUpperCase() === code);

    if (matchedCoupon) {
      // Check active status
      if (matchedCoupon.isActive === false) {
        return NextResponse.json({ valid: false, message: `Coupon code "${code}" is currently inactive.` });
      }

      // Check expiry date
      if (matchedCoupon.expiresAt) {
        const expiry = new Date(matchedCoupon.expiresAt);
        if (expiry.getTime() < Date.now()) {
          return NextResponse.json({ valid: false, message: `Coupon code "${code}" has expired on ${expiry.toLocaleDateString()}.` });
        }
      }

      // Check min order amount
      if (matchedCoupon.minOrderAmount && subtotal < matchedCoupon.minOrderAmount) {
        return NextResponse.json({
          valid: false,
          message: `Coupon code "${code}" requires a minimum order of ₹${matchedCoupon.minOrderAmount.toLocaleString('en-IN')}. Add ₹${(matchedCoupon.minOrderAmount - subtotal).toLocaleString('en-IN')} more to qualify.`,
        });
      }

      // Check usage limit
      if (matchedCoupon.usageLimit && matchedCoupon.usageCount >= matchedCoupon.usageLimit) {
        return NextResponse.json({ valid: false, message: `Coupon code "${code}" has reached its maximum usage limit.` });
      }

      // Calculate discount
      let discount = 0;
      if (matchedCoupon.discountType === 'percentage') {
        discount = Math.round(subtotal * (matchedCoupon.discountValue / 100));
        if (matchedCoupon.maxDiscount && discount > matchedCoupon.maxDiscount) {
          discount = matchedCoupon.maxDiscount;
        }
      } else {
        discount = Math.min(subtotal, matchedCoupon.discountValue);
      }

      return NextResponse.json({
        valid: true,
        code: matchedCoupon.code,
        discount,
        discountType: matchedCoupon.discountType,
        discountValue: matchedCoupon.discountValue,
        description: matchedCoupon.description || `${matchedCoupon.discountValue}${matchedCoupon.discountType === 'percentage' ? '% OFF' : '₹ FLAT OFF'}`,
        message: `Coupon ${matchedCoupon.code} applied successfully! Saved ₹${discount.toLocaleString('en-IN')}.`,
      });
    }

    // 2. Check Product-level Coupons
    let products: any[] = allProducts;
    if (fs.existsSync(PRODUCTS_FILE)) {
      try {
        const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) products = parsed;
      } catch {}
    }

    const matchedProduct = products.find(
      (p) =>
        (p.couponCode && p.couponCode.trim().toUpperCase() === code) ||
        (p.couponDiscount && p.couponDiscount.trim().toUpperCase() === code)
    );

    if (matchedProduct) {
      let discount = 0;
      const discountStr = (matchedProduct.couponDiscount || '').toUpperCase();
      const percentMatch = discountStr.match(/(\d+)%/);
      const flatMatch = discountStr.match(/₹?\s*(\d+)/);

      if (percentMatch) {
        discount = Math.round(subtotal * (parseInt(percentMatch[1], 10) / 100));
      } else if (flatMatch && !discountStr.includes('%')) {
        discount = Math.min(subtotal, parseInt(flatMatch[1], 10));
      } else {
        discount = Math.round(subtotal * 0.15);
      }

      return NextResponse.json({
        valid: true,
        code,
        discount,
        discountType: 'percentage',
        discountValue: 15,
        description: `Special coupon for ${matchedProduct.name}`,
        message: `Coupon ${code} applied for ${matchedProduct.name}! Saved ₹${discount.toLocaleString('en-IN')}.`,
      });
    }

    // 3. Dynamic numeric pattern e.g. SAFAWI15 -> 15%
    const numberMatch = code.match(/(\d{1,2})$/);
    if (numberMatch) {
      const percent = parseInt(numberMatch[1], 10);
      if (percent > 0 && percent <= 50) {
        const discount = Math.round(subtotal * (percent / 100));
        return NextResponse.json({
          valid: true,
          code,
          discount,
          discountType: 'percentage',
          discountValue: percent,
          description: `${percent}% OFF Special Promo`,
          message: `Promo ${code} applied! (${percent}% OFF - Saved ₹${discount.toLocaleString('en-IN')}).`,
        });
      }
    }

    return NextResponse.json({
      valid: false,
      message: 'Invalid or expired coupon code. Try SAFAWI15, RAMADAN20, ALZAIR10 or FIRST50.',
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, message: err?.message || 'Error validating coupon' }, { status: 500 });
  }
}
