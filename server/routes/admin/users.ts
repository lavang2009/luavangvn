import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/security/auth';
import { userStatusSchema } from '@/lib/validation/admin';
import { adminError } from '@/lib/security/admin-response';
import { fail, ok } from '@/lib/api';

type AdminUserListItem = {
  id: string;
  username?: unknown;
  email?: unknown;
  [key: string]: unknown;
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim().toLowerCase();
    const snap = await getAdminDb().collection('users').orderBy('createdAt', 'desc').limit(200).get();
    let items: AdminUserListItem[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, unknown>),
    }));
    if (q) {
      items = items.filter(
        (user) =>
          String(user.username ?? '').toLowerCase().includes(q) ||
          String(user.email ?? '').toLowerCase().includes(q),
      );
    }
    return ok({ items });
  } catch (e) {
    return adminError(e);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const uid = String(body.uid || '');
    if (!uid) return fail('Thiếu uid.');

    if (body.status) {
      const parsed = userStatusSchema.safeParse({ status: body.status });
      if (!parsed.success) return fail('Status không hợp lệ.');
      await getAdminDb().collection('users').doc(uid).update({ status: parsed.data.status, updatedAt: Date.now() });
    }

    if (body.role) {
      const role = body.role === 'admin' ? 'admin' : 'user';
      const target = await getAdminAuth().getUser(uid);
      const currentClaims = target.customClaims ?? {};
      const claims = { ...currentClaims };
      if (role === 'admin') claims.admin = true;
      else delete claims.admin;
      await getAdminAuth().setCustomUserClaims(uid, claims);
      await getAdminDb().collection('users').doc(uid).update({ role, updatedAt: Date.now() });
    }

    return ok({ updated: true });
  } catch (e) {
    return adminError(e);
  }
}
