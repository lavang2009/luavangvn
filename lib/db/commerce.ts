import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import type { Order } from '@/types/shop';
import { clamp } from '@/lib/utils';

type CartLine = { productId: string; quantity: number };

export async function createBalanceOrder(userId: string, lines: CartLine[], voucherCode?: string) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc();
  const now = Date.now();

  return db.runTransaction(async (tx) => {
    const userRef = db.collection('users').doc(userId);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new Error('PROFILE_NOT_FOUND');
    const user = userSnap.data()!;
    if (user.status !== 'active') throw new Error('ACCOUNT_BLOCKED');

    const grouped = new Map<string, number>();
    for (const line of lines) grouped.set(line.productId, clamp((grouped.get(line.productId) ?? 0) + line.quantity, 1, 20));
    const normalized = [...grouped.entries()].map(([productId, quantity]) => ({ productId, quantity }));

    const productSnaps = await Promise.all(normalized.map(({ productId }) => tx.get(db.collection('products').doc(productId))));
    const products = productSnaps.map((snap, index) => {
      if (!snap.exists) throw new Error('PRODUCT_NOT_FOUND');
      const data = snap.data()!;
      if (data.status !== 'active') throw new Error('PRODUCT_UNAVAILABLE');
      if (!['acc', 'file'].includes(data.category)) throw new Error('UNSUPPORTED_PRODUCT');
      return { ref: snap.ref, data, productId: normalized[index].productId, quantity: normalized[index].quantity };
    });

    let subtotal = 0;
    const items = products.map(({ data, productId, quantity }) => {
      const price = Math.max(0, Number(data.price));
      const stock = Math.max(0, Number(data.inventoryCount ?? 0));
      if (stock < quantity) throw new Error('OUT_OF_STOCK');
      subtotal += price * quantity;
      return { productId, name: String(data.name), slug: String(data.slug), category: data.category, unitPrice: price, quantity, thumbnail: String(data.thumbnail) };
    });

    let discount = 0;
    
    if (voucherCode) {
      const code = voucherCode.trim().toUpperCase();
      const vRef = db.collection('vouchers').doc(code);
      const voucherSnap = await tx.get(vRef);
      if (!voucherSnap.exists) throw new Error('VOUCHER_INVALID');
      const voucher = voucherSnap.data()!;
      const timeOk = Number(voucher.startsAt) <= now && Number(voucher.endsAt) >= now;
      if (!voucher.active || !timeOk) throw new Error('VOUCHER_EXPIRED');
      if (Number(voucher.minOrder ?? 0) > subtotal) throw new Error('VOUCHER_MIN_ORDER');
      if (voucher.category && !items.some((item) => item.category === voucher.category)) throw new Error('VOUCHER_CATEGORY');
      if (voucher.productId && !items.some((item) => item.productId === voucher.productId)) throw new Error('VOUCHER_PRODUCT');
      if (voucher.usageLimit != null && Number(voucher.usageCount ?? 0) >= Number(voucher.usageLimit)) throw new Error('VOUCHER_LIMIT');
      const usageRef = vRef.collection('uses').doc(userId);
      const usageSnap = await tx.get(usageRef);
      if (usageSnap.exists && Number(voucher.perUserLimit ?? 1) <= Number(usageSnap.data()?.count ?? 0)) throw new Error('VOUCHER_USER_LIMIT');
      discount = voucher.type === 'percent' ? Math.floor(subtotal * (Number(voucher.value) / 100)) : Number(voucher.value);
      if (voucher.maxDiscount) discount = Math.min(discount, Number(voucher.maxDiscount));
      discount = clamp(discount, 0, subtotal);
      tx.set(usageRef, { userId, count: FieldValue.increment(1), lastUsedAt: now }, { merge: true });
      tx.update(vRef, { usageCount: FieldValue.increment(1), updatedAt: now });
    }

    const total = Math.max(0, subtotal - discount);
    const balance = Number(user.balance ?? 0);
    if (balance < total) throw new Error('INSUFFICIENT_BALANCE');

    const deliveries: Array<{ deliveryId: string; orderId: string; userId: string; productId: string; category: string; type: string; username?: string; password?: string; credential?: string; note?: string; storagePath?: string; fileName?: string; status: string; createdAt: number }> = [];

    for (const product of products) {
      if (product.data.category === 'acc') {
        const q = db.collection('products').doc(product.productId).collection('inventory').where('status', '==', 'unsold').orderBy('createdAt', 'asc').limit(product.quantity);
        const invSnap = await tx.get(q);
        if (invSnap.size < product.quantity) throw new Error('OUT_OF_STOCK');
        for (const inv of invSnap.docs) {
          const item = inv.data();
          tx.update(inv.ref, { status: 'sold', soldAt: now, orderId: orderRef.id });
          const deliveryRef = db.collection('deliveries').doc();
          deliveries.push({ deliveryId: deliveryRef.id, orderId: orderRef.id, userId, productId: product.productId, category: 'acc', type: 'credential', username: item.username, password: item.password, credential: item.credential, note: item.note, status: 'delivered', createdAt: now });
          tx.set(deliveryRef, deliveries[deliveries.length - 1]);
        }
      } else {
        const asset = product.data.fileAsset;
        if (!asset?.storagePath) throw new Error('FILE_NOT_CONFIGURED');
        const deliveryRef = db.collection('deliveries').doc();
        const delivery = { deliveryId: deliveryRef.id, orderId: orderRef.id, userId, productId: product.productId, category: 'file', type: 'file', storagePath: asset.storagePath, fileName: asset.fileName ?? product.data.name, status: 'ready', createdAt: now };
        deliveries.push(delivery);
        tx.set(deliveryRef, delivery);
      }
      tx.update(product.ref, { inventoryCount: FieldValue.increment(-product.quantity), soldCount: FieldValue.increment(product.quantity), updatedAt: now });
    }

    const order: Order = {
      orderId: orderRef.id,
      userId,
      items,
      subtotal,
      discount,
      total,
      paymentMethod: 'balance',
      status: 'completed',
      deliveryStatus: 'delivered',
      createdAt: now,
      completedAt: now,
    };
    tx.create(orderRef, order);
    tx.set(userRef.collection('orders').doc(orderRef.id), order);
    tx.set(userRef.collection('transactions').doc(), { type: 'purchase', amount: -total, orderId: orderRef.id, createdAt: now, balanceBefore: balance, balanceAfter: balance - total });
    tx.update(userRef, { balance: FieldValue.increment(-total), totalSpent: FieldValue.increment(total), totalOrders: FieldValue.increment(1), updatedAt: now });
    tx.set(userRef.collection('notifications').doc(), { type: 'purchase', title: 'Mua hàng thành công', body: `Đơn ${orderRef.id} đã hoàn tất.`, orderId: orderRef.id, read: false, createdAt: now });

    return { orderId: orderRef.id, total, discount, deliveries };
  });
}
