import { requireAuth } from '@/lib/security/auth';
import { getAdminDb } from '@/lib/firebase/admin';
import { fail, ok } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    const snapshot = await getAdminDb().collection('users').doc(auth.uid).get();
    if (!snapshot.exists) return fail('Không tìm thấy hồ sơ.', 404, 'PROFILE_NOT_FOUND');
    const data = snapshot.data()!;
    return ok({ username: data.username, displayName: data.displayName, email: data.email, photoURL: data.photoURL, balance: Number(data.balance ?? 0), role: auth.admin ? 'admin' : 'user', status: data.status });
  } catch (error) {
    const message = error instanceof Error && error.message === 'UNAUTHORIZED' ? 'Bạn chưa đăng nhập.' : 'Không thể tải tài khoản.';
    return fail(message, error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 401, error instanceof Error && error.message === 'FORBIDDEN' ? 'FORBIDDEN' : 'UNAUTHORIZED');
  }
}
