import { getAdminDb } from '@/lib/firebase/admin';
import { fail, ok } from '@/lib/api';
import { toPublicProduct } from '@/lib/db/public-product';
import type { Product } from '@/types/shop';

export async function GET(_request: Request, { params }: { params: Record<string, string> }) {
  try {
    const { slug } = params;
    const snapshot = await getAdminDb().collection('products').where('slug', '==', slug).where('status', '==', 'active').limit(1).get();
    if (snapshot.empty) return fail('Không tìm thấy sản phẩm.', 404, 'PRODUCT_NOT_FOUND');
    const doc = snapshot.docs[0];
    return ok(toPublicProduct({ id: doc.id, ...doc.data() } as Product & Record<string, unknown>));
  } catch {
    return fail('Không thể tải sản phẩm.', 500, 'PRODUCT_ERROR');
  }
}
