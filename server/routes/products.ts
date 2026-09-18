import { getAdminDb } from '@/lib/firebase/admin';
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

    // Keep the public listing independent of Firestore composite indexes.
    // We query only the indexed status field, then apply optional filters and
    // ordering in memory. This avoids production 500s when a new Firebase
    // project has not yet built the optional compound indexes.
    const snapshot = await db.collection('products').where('status', '==', 'active').limit(200).get();
    let items = snapshot.docs.map((doc) => toPublicProduct({ id: doc.id, ...doc.data() } as Product & Record<string, unknown>));

    if (category) items = items.filter((item) => item.category === category);
    if (featured === 'true') items = items.filter((item) => item.featured === true);
    items.sort((a, b) => b.createdAt - a.createdAt);
    if (slug) items = items.filter((item) => item.slug === slug);
    items = items.slice(0, limit);

    return ok({ items });
  } catch (error) {
    console.error('[products-list]', error);
    return fail('Không thể tải danh sách sản phẩm.', 500, 'PRODUCTS_ERROR');
  }
}
