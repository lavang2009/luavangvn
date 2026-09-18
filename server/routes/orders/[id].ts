import { getAdminDb, getAdminStorage } from '@/lib/firebase/admin';
import { requireAuth } from '@/lib/security/auth';
import { fail, ok } from '@/lib/api';

export async function GET(request: Request, { params }: { params: Record<string, string> }) {
  try {
    const auth = await requireAuth(request);
    const { id } = params;
    const db = getAdminDb();
    const order = await db.collection('orders').doc(id).get();
    if (!order.exists) return fail('Không tìm thấy đơn hàng.', 404, 'ORDER_NOT_FOUND');
    if (order.data()?.userId !== auth.uid) return fail('Không có quyền truy cập.', 403, 'FORBIDDEN');
    if (order.data()?.status !== 'completed') return fail('Đơn chưa hoàn tất giao hàng.', 409, 'ORDER_NOT_READY');
    const deliveries = await db.collection('deliveries').where('orderId', '==', id).where('userId', '==', auth.uid).limit(20).get();
    return ok({ order: { id: order.id, ...order.data() }, deliveries: deliveries.docs.map((d) => { const x=d.data(); return { id:d.id, productId:x.productId, category:x.category, type:x.type, username:x.username, password:x.password, credential:x.credential, note:x.note, fileName:x.fileName, status:x.status }; }) });
  } catch { return fail('Không thể tải chi tiết đơn hàng.', 500, 'ORDER_DETAIL_FAILED'); }
}

export async function POST(request: Request, { params }: { params: Record<string, string> }) {
  try {
    const auth = await requireAuth(request); const { id } = params;
    const db = getAdminDb();
    const order = await db.collection('orders').doc(id).get();
    if (!order.exists || order.data()?.userId !== auth.uid) return fail('Không có quyền truy cập.', 403, 'FORBIDDEN');
    if (order.data()?.status !== 'completed') return fail('Đơn chưa đủ điều kiện tải file.', 409, 'ORDER_NOT_READY');
    const deliveries = await db.collection('deliveries').where('orderId', '==', id).where('userId', '==', auth.uid).where('type', '==', 'file').limit(10).get();
    if (deliveries.empty) return fail('Đơn không có file tải xuống.', 404, 'FILE_NOT_FOUND');
    const urls = [];
    for (const d of deliveries.docs) { const path = d.data().storagePath; if (!path) continue; const [url] = await getAdminStorage().bucket().file(path).getSignedUrl({ action: 'read', expires: Date.now()+5*60*1000 }); urls.push({ deliveryId:d.id, fileName:d.data().fileName, url }); }
    return ok({ urls });
  } catch { return fail('Không thể cấp link tải.', 500, 'DOWNLOAD_FAILED'); }
}
