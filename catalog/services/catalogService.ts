import { supabase } from '@/lib/supabase';

/**
 * Get all active products (both custom designs and finished goods)
 * - Custom designs: always shown if active
 * - Finished goods: shown if active AND in stock
 */
export async function getProducts(category: string | null = null) {
  let query = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .is('deleted_at', null);

  // Filter by category if specified
  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  // For finished goods, only show if in stock
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Filter finished goods by stock on client side (more efficient than DB query)
  return data.filter(p =>
    p.product_type === 'custom_design' ||
    (p.product_type === 'finished_good' && (p.stock_quantity || 0) > 0)
  );
}

/**
 * Get custom design products only
 */
export async function getCustomDesigns(category: string | null = null) {
  let query = supabase
    .from('products')
    .select('*')
    .eq('product_type', 'custom_design')
    .eq('active', true)
    .is('deleted_at', null);

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching custom designs:', error);
    return [];
  }
  return data;
}

/**
 * Get finished goods products only (in stock)
 */
export async function getFinishedGoods(category: string | null = null) {
  let query = supabase
    .from('products')
    .select('*')
    .eq('product_type', 'finished_good')
    .eq('active', true)
    .is('deleted_at', null)
    .gt('stock_quantity', 0);

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching finished goods:', error);
    return [];
  }
  return data;
}

/**
 * Get featured products (can be any type)
 */
export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .is('deleted_at', null)
    .eq('featured', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }

  // Filter finished goods by stock
  return data.filter(p =>
    p.product_type === 'custom_design' ||
    (p.product_type === 'finished_good' && (p.stock_quantity || 0) > 0)
  );
}

/**
 * Get product by ID (respects active/stock status)
 */
export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  // No row found (deleted/stale id) — not a real error, just not found
  if (!data) {
    return null;
  }

  // Check stock for finished goods
  if (data.product_type === 'finished_good' && (data.stock_quantity || 0) <= 0) {
    return null; // Out of stock
  }

  return data;
}

/**
 * Get finished good by ID (legacy support)
 * Now just calls getProductById with finished good check
 */
export async function getFinishedGoodById(id: string) {
  const data = await getProductById(id);
  return data?.product_type === 'finished_good' ? data : null;
}

/**
 * Get unique categories from active products
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('active', true)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const categories = new Set(data.map(item => item.category).filter(Boolean));
  return Array.from(categories).sort();
}

/**
 * Check product availability
 */
export async function checkProductAvailability(id: string): Promise<{
  available: boolean;
  type: 'custom_design' | 'finished_good';
  stock?: number;
}> {
  const { data, error } = await supabase
    .from('products')
    .select('product_type, stock_quantity, active, deleted_at')
    .eq('id', id)
    .single();

  if (error || !data || !data.active || data.deleted_at) {
    return { available: false, type: 'custom_design' };
  }

  if (data.product_type === 'custom_design') {
    return { available: true, type: 'custom_design' };
  }

  return {
    available: (data.stock_quantity || 0) > 0,
    type: 'finished_good',
    stock: data.stock_quantity || 0,
  };
}

/**
 * Get all product IDs for static page generation
 */
export async function getAllProductIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, product_type')
    .eq('active', true)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching product IDs:', error);
    return [];
  }

  const ids: string[] = [];
  for (const p of data) {
    if (p.product_type === 'finished_good') {
      ids.push(`rtw-${p.id}`);
    } else {
      ids.push(p.id);
    }
  }
  return ids;
}

export async function submitInquiry(inquiryData: any) {
  // customer_inquiries has RLS enabled with no anon insert policy, so this
  // goes through a server route (service role key) instead of the anon client.
  const response = await fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inquiryData),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    console.error('Error submitting inquiry:', result.message);
    throw new Error(result.message || 'Failed to submit inquiry');
  }

  return result.data;
}
