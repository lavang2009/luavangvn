import { getTransaction, saveProviderState, verifyCallbackSignature, decryptCardSecret, creditByDeclaredAmount } from '@/lib/db/card-topup';

async function readRawBody(request: Request) {
  return await request.text();
}

function parsePayload(raw: string, request: Request): Record<string, any> {
  const contentType = String(request.headers.get('content-type') ?? '').toLowerCase();
  if (contentType.includes('application/json')) {
    return JSON.parse(raw || '{}');
  }
  return Object.fromEntries(new URLSearchParams(raw).entries());
}

async function handle(request: Request) {
  if (request.method === 'GET') {
    return Response.json({ ok: true, message: 'NAPPAY callback is online. POST is required for callbacks.' });
  }
  if (request.method !== 'POST') {
    return Response.json({ ok: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const raw = await readRawBody(request);
    const data = parsePayload(raw, request);
    const requestId = String(data.request_id ?? data.requestId ?? '').trim();
    if (!requestId) return Response.json({ ok: false, message: 'missing_request_id' }, { status: 400 });

    const tx = await getTransaction(requestId);
    if (!tx) return Response.json({ ok: false, message: 'transaction_not_found' }, { status: 404 });
    if (tx.status === 'credited') {
      return Response.json({
        ok: true,
        credited: true,
        alreadyCredited: true,
        amount: Number(tx.creditedAmount ?? 0),
      });
    }

    const code = decryptCardSecret(String(tx.codeEncrypted ?? ''));
    const serial = decryptCardSecret(String(tx.serialEncrypted ?? ''));
    const actual = String(data.callback_sign ?? data.sign ?? '').trim();

    if (!verifyCallbackSignature({ code, serial, actual })) {
      return Response.json({ ok: false, message: 'invalid_signature' }, { status: 403 });
    }

    await saveProviderState(
      requestId,
      {
        ...data,
        status: Number(data.status ?? -1),
        value: data.value ?? 0,
        amount: data.amount ?? data.receive_amount ?? 0,
        declared_value: data.declared_value ?? tx.declaredAmount,
        trans_id: data.trans_id ?? null,
        message: data.message ?? '',
      },
      { callbackReceivedAt: new Date().toISOString() },
    );

    const credit = await creditByDeclaredAmount(requestId, data);

    return Response.json({
      ok: true,
      credited: Boolean(credit.credited || credit.alreadyCredited),
      alreadyCredited: Boolean(credit.alreadyCredited),
      creditedAmount: Number(credit.amount ?? 0),
    });
  } catch (error) {
    console.error('[nappay-callback]', error);
    return Response.json(
      { ok: false, message: 'Callback không thể được xử lý.' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
