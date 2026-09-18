import { getAdminDb } from '@/lib/firebase/admin';
import { requireAuth } from '@/lib/security/auth';
import { fail, ok } from '@/lib/api';
import { summary } from '@/lib/db/card-topup';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get('limit') ?? 50);
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? Math.trunc(rawLimit) : 50, 1), 100);
    const db = getAdminDb();

    let docs;
    try {
      const snap = await db.collection('cardTransactions').where('uid', '==', auth.uid).limit(limit).get();
      docs = snap.docs;
    } catch (error) {
      if (!/FAILED_PRECONDITION|index/i.test(String(error instanceof Error ? error.message : error))) throw error;
      const snap = await db.collection('cardTransactions').limit(Math.min(limit * 5, 500)).get();
      docs = snap.docs.filter((doc) => String(doc.data()?.uid ?? '') === auth.uid).slice(0, limit);
    }

    const rows = docs
      .map((doc) => summary({ requestId: doc.id, ...doc.data() }))
      .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));

    const userSnap = await db.collection('users').doc(auth.uid).get();
    const profile = userSnap.exists ? userSnap.data() ?? {} : {};

    return ok({
      balance: Number(profile.balance ?? 0),
      totalTopup: Number(profile.totalTopup ?? profile.totalDeposited ?? 0),
      rows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'UNAUTHORIZED') return fail('Bạn cần đăng nhập.', 401, 'UNAUTHORIZED');
    console.error('[nappay-card-history]', error);
    return fail('Không thể tải lịch sử nạp thẻ.', 500, 'CARD_HISTORY_FAILED');
  }
}
