import { requireAuth } from '@/lib/security/auth';
import { getTransaction, checkTransaction, summary } from '@/lib/db/card-topup';
import { fail, ok } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const requestId = String(body?.requestId ?? body?.request_id ?? '').trim();
    if (!/^NAPTHE_[A-Za-z0-9_-]+$/.test(requestId)) {
      return fail('Mã giao dịch không hợp lệ.', 400, 'INVALID_REQUEST_ID');
    }

    const existing = await getTransaction(requestId);
    if (!existing || String(existing.uid) !== auth.uid) {
      return fail('Không tìm thấy giao dịch.', 404, 'TRANSACTION_NOT_FOUND');
    }

    const result = await checkTransaction(requestId);
    if (!result.tx || String(result.tx.uid) !== auth.uid) {
      return fail('Không tìm thấy giao dịch.', 404, 'TRANSACTION_NOT_FOUND');
    }

    const provider = (result.provider ?? {}) as Record<string, any>;
    return ok({
      transaction: summary(result.tx),
      requestId,
      status: Number(provider.status ?? result.tx.providerStatus ?? -1),
      statusLabel: String(result.tx.statusLabel ?? ''),
      message: String(provider.message ?? result.tx.providerMessage ?? ''),
      declaredAmount: Number(result.tx.declaredAmount ?? 0),
      value: Number(provider.value ?? result.tx.realValue ?? 0),
      amount: Number(provider.amount ?? provider.receive_amount ?? result.tx.receiveAmount ?? 0),
      credited: result.tx.status === 'credited',
      creditedAmount: Number(result.tx.creditedAmount ?? 0),
      newBalance: result.credit?.newBalance ?? null,
      wrongValue: Boolean(result.credit?.wrongValue || result.tx.status === 'wrong_value'),
      endpoint: result.endpoint ?? result.tx.providerEndpoint ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'UNAUTHORIZED') return fail('Bạn cần đăng nhập.', 401, 'UNAUTHORIZED');
    if (message === 'TRANSACTION_NOT_FOUND') return fail('Không tìm thấy giao dịch.', 404, 'TRANSACTION_NOT_FOUND');
    if (message === 'NAPPAY_NOT_CONFIGURED') return fail('Hệ thống nạp thẻ chưa được cấu hình đầy đủ.', 503, 'NAPPAY_NOT_CONFIGURED');
    console.error('[nappay-card-check]', error);
    return fail('Không thể kiểm tra giao dịch lúc này.', 500, 'NAPPAY_CHECK_FAILED');
  }
}

export async function GET() {
  return ok({ message: 'NAPPAY card check endpoint online. Use POST.' });
}
