import { FieldValue } from 'firebase-admin/firestore';
import type { SePayWebhookEvent } from '@/lib/payments/types';
import { getAdminDb } from '@/lib/firebase/admin';

export async function settleSePayDeposit(event: SePayWebhookEvent) {
  const db = getAdminDb();
  const eventRef = db.collection('providerEvents').doc(event.externalId);
  const codeMatch = event.description.toUpperCase().match(/\bLV[A-Z0-9]{10}\b/);
  if (!codeMatch) throw new Error('PAYMENT_CODE_NOT_FOUND');
  const paymentCode = codeMatch[0];

  return db.runTransaction(async (tx) => {
    const processed = await tx.get(eventRef);
    if (processed.exists) return { duplicate: true };

    const deposits = await tx.get(db.collection('deposits').where('paymentCode', '==', paymentCode).limit(1));
    if (deposits.empty) throw new Error('DEPOSIT_NOT_FOUND');
    const depositRef = deposits.docs[0].ref;
    const deposit = deposits.docs[0].data();
    if (deposit.status === 'success') {
      tx.create(eventRef, { externalId: event.externalId, ignored: true, reason: 'ALREADY_SUCCESS', createdAt: Date.now() });
      return { duplicate: false, ignored: true };
    }
    if (deposit.status === 'rejected' || deposit.status === 'expired') throw new Error('DEPOSIT_FINAL');
    if (event.status !== 'success') {
      tx.update(depositRef, { status: event.status === 'pending' ? 'processing' : 'failed', updatedAt: Date.now(), providerReference: event.externalId });
      tx.create(eventRef, { externalId: event.externalId, ignored: true, status: event.status, createdAt: Date.now() });
      return { duplicate: false, ignored: true };
    }
    const expected = Number(deposit.requestedAmount ?? 0);
    if (event.amount !== expected) throw new Error('AMOUNT_MISMATCH');
    const userRef = db.collection('users').doc(String(deposit.userId));
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new Error('USER_NOT_FOUND');
    const balance = Number(userSnap.data()?.balance ?? 0);
    const now = Date.now();
    tx.update(depositRef, { status:'success', amount:event.amount, transactionId:event.externalId, providerReference:event.externalId, updatedAt:now, processedAt:now });
    tx.update(userRef, { balance:FieldValue.increment(event.amount), totalDeposited:FieldValue.increment(event.amount), updatedAt:now });
    tx.create(userRef.collection('transactions').doc(), { type:'deposit', amount:event.amount, depositId:deposit.depositId, provider:'sepay', providerReference:event.externalId, balanceBefore:balance, balanceAfter:balance+event.amount, createdAt:now });
    tx.create(userRef.collection('notifications').doc(), { type:'deposit', title:'Nạp tiền thành công', body:`Ví đã được cộng ${event.amount.toLocaleString('vi-VN')}đ.`, depositId:deposit.depositId, read:false, createdAt:now });
    tx.create(eventRef, { externalId:event.externalId, depositId:deposit.depositId, amount:event.amount, createdAt:now });
    return { duplicate:false, depositId:deposit.depositId, amount:event.amount };
  });
}
