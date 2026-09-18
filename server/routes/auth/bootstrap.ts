import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAuth } from '@/lib/security/auth';
import { fail, ok } from '@/lib/api';

const bootstrapSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const db = getAdminDb();
    const ref = db.collection('users').doc(auth.uid);
    const current = await ref.get();
    const now = Date.now();
    let body: { username?: string } = {};

    try {
      body = bootstrapSchema.parse(await request.json());
    } catch {
      // Empty body is intentionally valid for subsequent session refreshes.
    }

    if (!current.exists) {
      const userRecord = await (await import('@/lib/firebase/admin')).getAdminAuth().getUser(auth.uid);
      const username = body.username ?? (userRecord.email?.split('@')[0] ?? `user_${auth.uid.slice(0, 8)}`).slice(0, 30);
      await ref.set({
        uid: auth.uid,
        username,
        displayName: userRecord.displayName ?? 'Thành viên',
        email: userRecord.email ?? '',
        photoURL: userRecord.photoURL ?? '',
        provider: userRecord.providerData[0]?.providerId ?? 'password',
        role: auth.admin ? 'admin' : 'user',
        balance: 0,
        totalSpent: 0,
        totalDeposited: 0,
        totalOrders: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });
    } else {
      await ref.update({ lastLoginAt: now, updatedAt: now });
    }

    return ok({ ready: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'UNAUTHORIZED') return fail('Bạn cần đăng nhập.', 401, 'UNAUTHORIZED');
    console.error('[auth-bootstrap]', error);
    return fail('Không thể khởi tạo tài khoản.', 500, 'AUTH_BOOTSTRAP_FAILED');
  }
}
