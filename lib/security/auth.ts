import { getAdminAuth } from '@/lib/firebase/admin';

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

export async function requireAuth(request: Request): Promise<AuthContext> {
  const token = await getBearerToken(request);
  if (!token) throw new Error('UNAUTHORIZED');
  const decoded = await getAdminAuth().verifyIdToken(token, true);
  return { uid: decoded.uid, email: decoded.email, admin: decoded.admin === true };
}

export async function requireAdmin(request: Request): Promise<AuthContext> {
  const auth = await requireAuth(request);
  if (!auth.admin) throw new Error('FORBIDDEN');
  return auth;
}
