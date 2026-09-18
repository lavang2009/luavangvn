import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/security/auth';
import { voucherSchema } from '@/lib/validation/schemas';
import { adminError } from '@/lib/security/admin-response';
import { fail, ok } from '@/lib/api';

export async function GET(request:Request){try{await requireAdmin(request);const snap=await getAdminDb().collection('vouchers').orderBy('endsAt','desc').limit(200).get();return ok({items:snap.docs.map(d=>({id:d.id,...d.data()}))});}catch(e){return adminError(e)}}
export async function POST(request:Request){try{const auth=await requireAdmin(request);const parsed=voucherSchema.safeParse(await request.json());if(!parsed.success)return fail(parsed.error.issues[0]?.message??'Voucher không hợp lệ.');if(parsed.data.endsAt<=parsed.data.startsAt)return fail('Thời gian voucher không hợp lệ.');if(parsed.data.type==='percent'&&parsed.data.value>100)return fail('Percent không vượt quá 100.');const db=getAdminDb();const ref=db.collection('vouchers').doc(parsed.data.code);const existing=await ref.get();if(existing.exists)return fail('Mã voucher đã tồn tại.',409,'VOUCHER_EXISTS');await ref.set({...parsed.data,code:parsed.data.code,usageCount:0,createdAt:Date.now(),updatedAt:Date.now(),createdBy:auth.uid});return ok({id:ref.id},201);}catch(e){return adminError(e)}}
export async function PATCH(request:Request){try{await requireAdmin(request);const body=await request.json();const code=String(body.code||'').toUpperCase();if(!code)return fail('Thiếu voucher code.');await getAdminDb().collection('vouchers').doc(code).update({...(body.data??{}),updatedAt:Date.now()});return ok({updated:true});}catch(e){return adminError(e)}}
