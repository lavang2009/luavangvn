import { getAdminDb, getAdminStorage } from '@/lib/firebase/admin';
import { requireAuth } from '@/lib/security/auth';
import { fail, ok } from '@/lib/api';

export async function POST(request: Request, { params }: { params: Record<string, string> }) {
  try {
    const auth=await requireAuth(request); const {orderId}=params; const db=getAdminDb();
    const order=await db.collection('orders').doc(orderId).get();
    if(!order.exists||order.data()?.userId!==auth.uid)return fail('Không có quyền truy cập.',403,'FORBIDDEN');
    if(order.data()?.status!=='completed')return fail('Đơn chưa đủ điều kiện tải.',409,'ORDER_NOT_READY');
    const deliveries=await db.collection('deliveries').where('orderId','==',orderId).where('userId','==',auth.uid).where('type','==','file').limit(10).get();
    if(deliveries.empty)return fail('Không có file giao hàng.',404,'FILE_NOT_FOUND');
    const urls=[]; for(const d of deliveries.docs){const x=d.data();if(!x.storagePath)continue;const [url]=await getAdminStorage().bucket().file(x.storagePath).getSignedUrl({action:'read',expires:Date.now()+5*60*1000});urls.push({deliveryId:d.id,fileName:x.fileName,url});}
    return ok({urls});
  }catch{return fail('Không thể tạo link tải.',500,'DOWNLOAD_FAILED')}
}
