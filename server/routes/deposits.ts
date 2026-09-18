import { getAdminDb } from '@/lib/firebase/admin';
import { requireAuth } from '@/lib/security/auth';
import { depositSchema } from '@/lib/validation/schemas';
import { createPaymentCode, createSePayDepositPayload } from '@/services/payments/sepay';
import { fail, ok } from '@/lib/api';
import { rateLimit } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const rl = rateLimit(`deposit:${auth.uid}`, 10, 60000);
    if (!rl.ok) return fail('Bạn gửi yêu cầu quá nhanh. Hãy thử lại sau.', 429, 'RATE_LIMITED');
    const parsed = depositSchema.safeParse(await request.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Số tiền không hợp lệ.');
    const { amount } = parsed.data;
    const depositId = getAdminDb().collection('deposits').doc().id;
    const paymentCode = createPaymentCode();
    const now = Date.now();
    await getAdminDb().collection('deposits').doc(depositId).set({
      depositId,
      userId: auth.uid,
      amount: 0,
      requestedAmount: amount,
      method: 'sepay',
      provider: 'sepay',
      status: 'pending',
      paymentCode,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + 15 * 60 * 1000,
      providerReference: null,
      transactionId: null,
      metadata: { paymentCode },
    });
    const payment = await createSePayDepositPayload(amount, paymentCode);
    return ok({ depositId, paymentCode, ...payment, expiresAt: now + 15 * 60 * 1000 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Bạn cần đăng nhập.', 401, 'UNAUTHORIZED');
    return fail('Không thể tạo yêu cầu nạp tiền.', 500, 'DEPOSIT_CREATE_FAILED');
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    const db = getAdminDb();

    const [depositSnapshot, cardSnapshot] = await Promise.all([
      db.collection('deposits').where('userId', '==', auth.uid).limit(50).get(),
      db.collection('cardTransactions').where('uid', '==', auth.uid).limit(50).get(),
    ]);

    const bankItems = depositSnapshot.docs.map((d) => ({
      ...d.data(),
      method: d.data().method ?? 'sepay',
      provider: d.data().provider ?? 'sepay',
    }));

    const cardItems = cardSnapshot.docs.map((d) => {
      const data = d.data();
      const success = data.status === 'credited';
      return {
        depositId: d.id,
        userId: auth.uid,
        requestedAmount: Number(data.declaredAmount ?? 0),
        amount: Number(data.creditedAmount ?? 0),
        method: 'nappay_card',
        provider: 'nappay',
        providerReference: data.transId ?? null,
        status: success ? 'success' : data.status,
        createdAt: Date.parse(String(data.createdAt ?? '')) || Date.now(),
        updatedAt: Date.parse(String(data.updatedAt ?? '')) || Date.now(),
        paymentCode: d.id,
        metadata: {
          telco: data.telco ?? null,
          declaredAmount: Number(data.declaredAmount ?? 0),
          realValue: Number(data.realValue ?? 0),
        },
      };
    });

    const items = [...bankItems, ...cardItems]
      .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0))
      .slice(0, 100);

    return ok({ items });
  } catch (error) {
    console.error('[deposits-history]', error);
    return fail('Không thể tải lịch sử nạp.', 500, 'DEPOSIT_HISTORY_FAILED');
  }
}
