import { getAdminDb } from '@/lib/firebase/admin';
import { requireAuth } from '@/lib/security/auth';
import { fail, ok } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    const snapshot = await getAdminDb()
      .collection('deposits')
      .where('userId', '==', auth.uid)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    return ok({ items: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch {
    return fail('Không thể tải lịch sử nạp tiền.', 500, 'DEPOSIT_HISTORY_FAILED');
  }
}
