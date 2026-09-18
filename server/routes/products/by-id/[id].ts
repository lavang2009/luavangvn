import { getAdminDb } from '@/lib/firebase/admin';
import { fail, ok } from '@/lib/api';
import { toPublicProduct } from '@/lib/db/public-product';
import type { Product } from '@/types/shop';
export async function GET(_request:Request,{params}:{params:Record<string,string>}){try{const {id}=params;const snap=await getAdminDb().collection('products').doc(id).get();if(!snap.exists||snap.data()?.status!=='active')return fail('Không tìm thấy sản phẩm.',404,'NOT_FOUND');return ok(toPublicProduct({id:snap.id,...snap.data()} as Product & Record<string, unknown>));}catch{return fail('Không thể tải sản phẩm.',500,'PRODUCT_ERROR')}}
