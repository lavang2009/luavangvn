import { getAdminDb } from '@/lib/firebase/admin';
import type { Query } from 'firebase-admin/firestore';
import { fail, ok } from '@/lib/api';
import type { Product } from '@/types/shop';
import { toPublicProduct } from '@/lib/db/public-product';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const slug = searchParams.get('slug');
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 24)));

    const db = getAdminDb();
    let query = db.collection('products').where('status', '==', 'active') as Query;
    if (category) query = query.where('category', '==', category);
    if (featured === 'true') query = query.where('featured', '==', true);
    query = query.orderBy('createdAt', 'desc').limit(limit);
    const snapshot = await query.get();

    const items = snapshot.docs.map((doc) => toPublicProduct({ id: doc.id, ...doc.data() } as Product & Record<string, unknown>));
    const filtered = slug ? items.filter((p) => p.slug === slug) : items;
    return ok({ items: filtered });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Không thể tải sản phẩm.', 500, 'PRODUCTS_ERROR');
  }
}
