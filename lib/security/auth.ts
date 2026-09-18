import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export interface AuthContext {
  uid: string;
  email?: string;
  admin: boolean;
}

export async function getBearerToken(request: Request) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

function csv(value: string | undefined) {
  return new Set((value ?? '').split(',').map((item) => item.trim()).filter(Boolean));
}

export async function requireAuth(request: Request): Promise<AuthContext> {
  const token = await getBearerToken(request);
  if (!token) throw new Error('UNAUTHORIZED');
  const decoded = await getAdminAuth().verifyIdToken(token, false);

  let admin = decoded.admin === true;
  if (!admin && csv(process.env.ADMIN_UIDS).has(decoded.uid)) admin = true;
  if (!admin && decoded.email && csv(process.env.ADMIN_EMAILS).has(decoded.email)) admin = true;

  if (!admin) {
    try {
      const snapshot = await getAdminDb().collection('users').doc(decoded.uid).get();
      admin = snapshot.data()?.role === 'admin';
    } catch {
      // Authentication remains valid even when the profile lookup is temporarily unavailable.
    }
  }

  return { uid: decoded.uid, email: decoded.email, admin };
}

export async function requireAdmin(request: Request): Promise<AuthContext> {
  const auth = await requireAuth(request);
  if (!auth.admin) throw new Error('FORBIDDEN');
  return auth;
}
