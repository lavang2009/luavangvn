import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/security/auth';
import { adminError } from '@/lib/security/admin-response';
import { ok } from '@/lib/api';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db=getAdminDb();
    const [users,products,orders,deposits] = await Promise.all([
      db.collection('users').where('status','==','active').count().get(),
      db.collection('products').where('status','==','active').count().get(),
      db.collection('orders').count().get(),
      db.collection('deposits').count().get(),
    ]);
    const revenueSnap=await db.collection('orders').where('status','==','completed').limit(5000).get();
    const revenue=revenueSnap.docs.reduce((n,d)=>n+Number(d.data().total??0),0);
    const pendingDeposit=await db.collection('deposits').where('status','in',['pending','processing']).count().get();
    const stockSnap=await db.collection('products').where('status','==','active').get();
    const stock=stockSnap.docs.reduce((n,d)=>n+Number(d.data().inventoryCount??0),0);
    return ok({users:users.data().count,products:products.data().count,orders:orders.data().count,deposits:deposits.data().count,revenue,pendingDeposits:pendingDeposit.data().count,stock});
  } catch(e){return adminError(e)}
}
