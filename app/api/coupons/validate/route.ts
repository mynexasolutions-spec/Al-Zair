import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = (body.code || '').trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;

    if (!code) {
      return NextResponse.json({ valid: false, message: 'Please enter a coupon code.' }, { status: 400 });
    }

    // 1. Check in Coupons Supabase Table
    const { data: couponData, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .ilike('code', code)
      .maybeSingle();

    if (!couponError && couponData) {
      // Check active status
      if (couponData.is_active === false) {
        return NextResponse.json({ valid: false, message: `Coupon code "${code}" is currently inactive.` });
      }

      // Check expiry date
      if (couponData.expires_at) {
        const expiry = new Date(couponData.expires_at);
        if (expiry.getTime() < Date.now()) {
          return NextResponse.json({ valid: false, message: `Coupon code "${code}" has expired on ${expiry.toLocaleDateString()}.` });
        }
      }

      const minOrder = Number(couponData.min_order_amount) || 0;
      // Check min order amount
      if (minOrder > 0 && subtotal < minOrder) {
        return NextResponse.json({
          valid: false,
          message: `Coupon code "${code}" requires a minimum order of ₹${minOrder.toLocaleString('en-IN')}. Add ₹${(minOrder - subtotal).toLocaleString('en-IN')} more to qualify.`,
        });
      }

      const usageLimit = couponData.usage_limit ? Number(couponData.usage_limit) : null;
      const usageCount = Number(couponData.usage_count) || 0;
      // Check usage limit
      if (usageLimit !== null && usageCount >= usageLimit) {
        return NextResponse.json({ valid: false, message: `Coupon code "${code}" has reached its maximum usage limit.` });
      }

      // Calculate discount
      let discount = 0;
      const discountType = couponData.discount_type || 'percentage';
      const discountVal = Number(couponData.discount_value) || 0;
      const maxDiscount = couponData.max_discount ? Number(couponData.max_discount) : null;

      if (discountType === 'percentage') {
        discount = Math.round(subtotal * (discountVal / 100));
        if (maxDiscount && discount > maxDiscount) {
          discount = maxDiscount;
        }
      } else {
        discount = Math.min(subtotal, discountVal);
      }

      return NextResponse.json({
        valid: true,
        code: couponData.code,
        discount,
        discountType,
        discountValue: discountVal,
        description: couponData.description || `${discountVal}${discountType === 'percentage' ? '% OFF' : '₹ FLAT OFF'}`,
        message: `Coupon ${couponData.code} applied successfully! Saved ₹${discount.toLocaleString('en-IN')}.`,
      });
    }

    // 2. Check Product-level Coupons from Supabase products table
    const { data: prodData } = await supabaseAdmin
      .from('products')
      .select('*')
      .or(`coupon_code.ilike.${code},coupon_discount.ilike.${code}`);

    if (prodData && prodData.length > 0) {
      const matchedProduct = prodData[0];
      let discount = 0;
      const discountStr = (matchedProduct.coupon_discount || matchedProduct.couponDiscount || '').toUpperCase();
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
      message: 'Invalid or expired coupon code. Try RAMADAN20, WELCOME10, or SAVE15.',
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, message: err?.message || 'Error validating coupon' }, { status: 500 });
  }
}
