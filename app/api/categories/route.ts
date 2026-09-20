import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categoriesSet = new Set<string>();
    let categoryCards: { id: string; name: string; image: string; link: string }[] = [];

    // 1. Fetch configured featured categories from Supabase homepage_content
    const { data: homeData, error: homeError } = await supabaseAdmin
      .from('homepage_content')
      .select('featured_products')
      .eq('id', 'main_homepage')
      .single();

    if (!homeError && homeData?.featured_products && Array.isArray(homeData.featured_products)) {
      categoryCards = homeData.featured_products;
      categoryCards.forEach((c: any) => {
        if (c.name && c.name.trim()) categoriesSet.add(c.name.trim());
      });
    }

    // 2. Also fetch all distinct categories present in the products table
    const { data: prodData, error: prodError } = await supabaseAdmin
      .from('products')
      .select('category');

    if (!prodError && prodData && Array.isArray(prodData)) {
      prodData.forEach((p: any) => {
        if (p.category && p.category.trim()) categoriesSet.add(p.category.trim());
      });
    }

    // Fallback default list if database categories are empty
    if (categoriesSet.size === 0) {
      ['Dates', 'Dates Laddu', 'Stuffed Dates', 'Date Bites', 'Gift Packs'].forEach((c) =>
        categoriesSet.add(c)
      );
    }

    const categoriesArray = Array.from(categoriesSet);

    return NextResponse.json({
      success: true,
      source: 'supabase',
      data: categoriesArray,
      categoriesWithMeta: categoryCards,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

