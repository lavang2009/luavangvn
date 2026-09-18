import { getAdminDb } from '@/lib/firebase/admin';
import { fail, ok } from '@/lib/api';

export async function GET() {
  try {
    const db = getAdminDb();
    const [products, users] = await Promise.all([
      db.collection('products').where('status', '==', 'active').get(),
      db.collection('users').where('status', '==', 'active').get(),
    ]);
    const sold = products.docs.reduce((n, d) => n + Number(d.data().soldCount ?? 0), 0);
    return ok({ products: products.size, sold, users: users.size });
  } catch {
    return fail('Không thể tải thống kê.', 500, 'STATS_ERROR');
  }
}
