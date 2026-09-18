import { getAdminDb } from '@/lib/firebase/admin';
import { requireAuth } from '@/lib/security/auth';
import { fail, ok } from '@/lib/api';
import { z } from 'zod';

const bodySchema=z.object({ productId:z.string().min(1), active:z.boolean() });
export async function GET(request:Request){try{const auth=await requireAuth(request);const snap=await getAdminDb().collection('users').doc(auth.uid).collection('favorites').orderBy('createdAt','desc').limit(100).get();return ok({items:snap.docs.map(d=>d.data())});}catch{return fail('Không thể tải yêu thích.',500,'FAVORITES_FAILED')}}
export async function POST(request:Request){try{const auth=await requireAuth(request);const parsed=bodySchema.safeParse(await request.json());if(!parsed.success)return fail('Dữ liệu không hợp lệ.');const ref=getAdminDb().collection('users').doc(auth.uid).collection('favorites').doc(parsed.data.productId);if(parsed.data.active) await ref.set({productId:parsed.data.productId,createdAt:Date.now()});else await ref.delete();return ok({active:parsed.data.active});}catch{return fail('Không thể cập nhật yêu thích.',500,'FAVORITE_UPDATE_FAILED')}}
