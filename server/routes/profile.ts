import { getAdminDb } from '@/lib/firebase/admin';
import { requireAuth } from '@/lib/security/auth';
import { fail, ok } from '@/lib/api';
import { isHttpsUrl } from '@/lib/utils';

export async function GET(request: Request) {
  try { const auth=await requireAuth(request); const snap=await getAdminDb().collection('users').doc(auth.uid).get(); if(!snap.exists)return fail('Không tìm thấy tài khoản.',404,'NOT_FOUND'); return ok(snap.data()); } catch { return fail('Không thể tải hồ sơ.',401,'UNAUTHORIZED'); }
}

export async function PATCH(request: Request) {
  try { const auth=await requireAuth(request); const body=await request.json(); const allowed={ displayName: typeof body.displayName==='string'?body.displayName.trim().slice(0,80):undefined, photoURL: typeof body.photoURL==='string' && isHttpsUrl(body.photoURL.trim())?body.photoURL.trim():undefined }; const update=Object.fromEntries(Object.entries(allowed).filter(([,v])=>v!==undefined)); await getAdminDb().collection('users').doc(auth.uid).update({ ...update, updatedAt: Date.now() }); return ok({ updated:true }); } catch { return fail('Không thể cập nhật hồ sơ.',400,'PROFILE_UPDATE_FAILED'); }
}
