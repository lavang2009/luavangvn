import { fail, ok } from '@/lib/api';
import { processSePayPayload, verifySePaySignature } from '@/services/payments/sepay';

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const verified = verifySePaySignature(rawBody, request.headers);
    if (!verified.ok) {
      return fail(verified.message ?? 'Webhook không hợp lệ.', verified.status ?? 401, 'SEPAY_WEBHOOK_REJECTED');
    }

    let payload: Record<string, any>;
    try {
      payload = JSON.parse(rawBody || '{}');
    } catch {
      return fail('Webhook JSON không hợp lệ.', 400, 'INVALID_JSON');
    }

    const result = await processSePayPayload(payload);
    if (result.success === false) {
      return fail(
        String(result.message ?? 'Không thể xử lý giao dịch.'),
        Number(result.status ?? 422),
        String(result.reason ?? 'SEPAY_TRANSACTION_REJECTED').toUpperCase(),
      );
    }
    return ok(result, Number(result.status ?? 200));
  } catch (error) {
    console.error('[sepay-webhook]', error);
    return fail('Webhook bị từ chối.', 400, 'WEBHOOK_REJECTED');
  }
}

export async function GET() {
  return ok({ online: true, method: 'POST' });
}
