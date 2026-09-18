import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/security/auth';
import { adminError } from '@/lib/security/admin-response';
import { ok } from '@/lib/api';
import { summary } from '@/lib/db/card-topup';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getAdminDb();
    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get('limit') ?? 200);
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? Math.trunc(rawLimit) : 200, 1), 500);
    const snap = await db.collection('cardTransactions').limit(limit).get();

    const rows = snap.docs
      .map((doc) => ({
        uid: String(doc.data()?.uid ?? ''),
        username: String(doc.data()?.username ?? ''),
        ...summary({ requestId: doc.id, ...doc.data() }),
      }))
      .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));

    let creditedAmount = 0;
    let pending = 0;
    let credited = 0;

    for (const row of rows) {
      if (row.status === 'credited') {
        credited += 1;
        creditedAmount += Number(row.creditedAmount ?? 0);
      }
      if (['pending', 'submitted', 'provider_unknown'].includes(row.status)) pending += 1;
    }

    return ok({
      rows,
      stats: {
        total: rows.length,
        credited,
        pending,
        creditedAmount,
      },
    });
  } catch (error) {
    return adminError(error);
  }
}
