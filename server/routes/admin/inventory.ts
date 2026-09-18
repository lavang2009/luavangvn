import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/security/auth';
import { inventorySchema } from '@/lib/validation/admin';
import { adminError } from '@/lib/security/admin-response';
import { fail, ok } from '@/lib/api';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const rows: unknown[] = Array.isArray(body?.items) ? body.items : [body];
    if (rows.length > 200) return fail('Mỗi lần import tối đa 200 ACC.');

    const parsed = rows.map((row: unknown) => inventorySchema.safeParse(row));
    const invalid = parsed.find((result) => !result.success);
    if (invalid && !invalid.success) {
      return fail(invalid.error.issues[0]?.message ?? 'Inventory không hợp lệ.');
    }

    const db = getAdminDb();
    const batch = db.batch();
    for (const result of parsed) {
      if (!result.success) continue;
      const pRef = db.collection('products').doc(result.data.productId);
      const product = await pRef.get();
      if (!product.exists || product.data()?.category !== 'acc') {
        return fail('Product inventory phải là danh mục ACC.');
      }
      const ref = pRef.collection('inventory').doc();
      const now = Date.now();
      batch.set(ref, { ...result.data, status: 'unsold', createdAt: now, updatedAt: now });
      batch.update(pRef, { inventoryCount: FieldValue.increment(1), updatedAt: now });
    }

    await batch.commit();
    return ok({ inserted: parsed.filter((result) => result.success).length });
  } catch (e) {
    return adminError(e);
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');
    const q = searchParams.get('q')?.toLowerCase().trim();
    if (!productId) return fail('Thiếu productId.');

    let query = getAdminDb().collection('products').doc(productId).collection('inventory').orderBy('createdAt', 'desc').limit(200);
    if (status) query = query.where('status', '==', status) as typeof query;

    const snap = await query.get();
    let items = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        username: data.username,
        status: data.status,
        soldAt: data.soldAt,
        orderId: data.orderId,
        createdAt: data.createdAt,
        note: data.note,
      };
    });

    if (q) {
      items = items.filter((item) => String(item.username ?? '').toLowerCase().includes(q));
    }
    return ok({ items });
  } catch (e) {
    return adminError(e);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const itemId = searchParams.get('itemId');
    if (!productId || !itemId) return fail('Thiếu productId/itemId.');

    const db = getAdminDb();
    await db.runTransaction(async (tx) => {
      const pRef = db.collection('products').doc(productId);
      const ref = pRef.collection('inventory').doc(itemId);
      const item = await tx.get(ref);
      if (!item.exists) throw new Error('INVENTORY_NOT_FOUND');
      if (item.data()?.status !== 'unsold') throw new Error('INVENTORY_SOLD');
      tx.delete(ref);
      tx.update(pRef, { inventoryCount: FieldValue.increment(-1), updatedAt: Date.now() });
    });
    return ok({ deleted: true });
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    if (code === 'INVENTORY_NOT_FOUND') return fail('Không tìm thấy inventory.', 404, code);
    if (code === 'INVENTORY_SOLD') return fail('Không thể xóa ACC đã bán.', 409, code);
    return adminError(e);
  }
}
