import { requireAuth } from '@/lib/security/auth';
import { rateLimit } from '@/lib/security/rate-limit';
import { getAdminDb } from '@/lib/firebase/admin';
import { validateCardInput } from '@/lib/payments/nappay';
import { fail, ok } from '@/lib/api';
import { submitCard } from '@/lib/db/card-topup';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const rl = rateLimit(`nappay-card:${auth.uid}`, 5, 60_000);
    if (!rl.ok) return fail('Bạn gửi quá nhiều yêu cầu nạp thẻ. Hãy thử lại sau.', 429, 'RATE_LIMITED');

    const body = await request.json();
    const telco = String(body?.network ?? '').trim().toUpperCase();
    const amount = Number(body?.denomination);
    const serial = String(body?.serial ?? '').trim();
    const code = String(body?.pin ?? body?.code ?? '').trim();

    validateCardInput(telco, amount, code, serial);

    const userSnap = await getAdminDb().collection('users').doc(auth.uid).get();
    const username = String(userSnap.data()?.username ?? userSnap.data()?.displayName ?? auth.email ?? '');

    const result = await submitCard({
      uid: auth.uid,
      username,
      telco,
      amount,
      code,
      serial,
    });

    const provider = result.provider as Record<string, unknown>;
    const wrongValue = Boolean(result.credit?.wrongValue || Number(provider.value || provider.declared_value || 0) !== 0 && Number(provider.status) === 2);

    return ok({
      requestId: result.requestId,
      status: result.status,
      statusLabel: result.statusLabel,
      message: wrongValue
        ? `SAI MỆNH GIÁ: Bạn chọn ${amount.toLocaleString('vi-VN')}đ nhưng NAPPAY xác nhận ${Number(provider.value || provider.declared_value || 0).toLocaleString('vi-VN')}đ. Thẻ đã được nhà cung cấp xử lý; shop không cộng tiền. Hãy kiểm tra thật kỹ mệnh giá trước khi gửi thẻ.`
        : String(result.message ?? provider.message ?? ''),
      declaredAmount: amount,
      value: Number(provider.value ?? 0),
      receiveAmount: Number(provider.amount ?? provider.receive_amount ?? 0),
      credited: Boolean(result.credit?.credited || result.credit?.alreadyCredited),
      creditedAmount: Number(result.credit?.amount ?? 0),
      wrongValue,
      providerUnknown: Boolean(result.providerUnknown),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SERVER_ERROR';
    if (message === 'UNAUTHORIZED') return fail('Bạn cần đăng nhập.', 401, 'UNAUTHORIZED');
    if (message === 'CARD_ALREADY_SUBMITTED') return fail('Thẻ này đã được gửi trước đó và không thể gửi lại.', 409, 'CARD_ALREADY_SUBMITTED');
    if (message === 'NAPPAY_NOT_CONFIGURED') return fail('Hệ thống nạp thẻ chưa được cấu hình đầy đủ.', 503, 'NAPPAY_NOT_CONFIGURED');
    if (message === 'APP_ENCRYPTION_KEY_INVALID') return fail('Hệ thống bảo mật đang thiếu cấu hình mã hóa.', 503, 'APP_ENCRYPTION_KEY_INVALID');
    if (
      message.includes('Mệnh giá') ||
      message.includes('Nhà mạng') ||
      message.includes('Mã thẻ') ||
      message.includes('serial')
    ) {
      return fail(message, 400, 'INVALID_CARD');
    }
    console.error('[nappay-card]', error);
    return fail('Không thể gửi thẻ lúc này. Vui lòng thử lại.', 500, 'NAPPAY_CARD_FAILED');
  }
}
