import crypto from 'node:crypto';
import { getAdminDb } from '@/lib/firebase/admin';
import { callbackSign, checkSign, chargingSign, nappayRequest, requireNappayConfig, statusLabel } from '@/lib/payments/nappay';
import { decryptSecret, encryptSecret } from '@/lib/security/card-secrets';

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function randomRequestId() {
  return `NAPTHE_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

function fingerprint(serial: string, code: string) {
  const secret = clean(process.env.APP_ENCRYPTION_KEY);
  if (!/^[0-9a-fA-F]{64}$/.test(secret)) throw new Error('APP_ENCRYPTION_KEY_INVALID');
  return crypto.createHmac('sha256', Buffer.from(secret, 'hex')).update(`${serial}|${code}`, 'utf8').digest('hex');
}

type JsonRecord = Record<string, unknown>;

export interface CardCreditResult {
  credited: boolean;
  alreadyCredited: boolean;
  amount: number;
  newBalance?: number;
  wrongValue?: boolean;
  actualValue?: number;
}

export function summary(row: JsonRecord) {
  return {
    requestId: row.requestId,
    telco: clean(row.telco),
    declaredAmount: num(row.declaredAmount),
    realValue: num(row.realValue),
    receiveAmount: num(row.receiveAmount),
    creditedAmount: num(row.creditedAmount),
    status: clean(row.status),
    statusLabel: clean(row.statusLabel),
    providerStatus: num(row.providerStatus),
    providerMessage: clean(row.providerMessage),
    transId: row.transId ?? null,
    codeMasked: clean(row.codeMasked),
    serialMasked: clean(row.serialMasked),
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
    creditMode: clean(row.creditMode),
  };
}

export async function createTransaction(input: {
  uid: string;
  username?: string;
  telco: string;
  declaredAmount: number;
  code: string;
  serial: string;
}) {
  const db = getAdminDb();
  const requestId = randomRequestId();
  const txRef = db.collection('cardTransactions').doc(requestId);
  const fp = fingerprint(input.serial, input.code);
  const lockRef = db.collection('cardFingerprints').doc(fp);
  const createdAt = nowIso();

  await db.runTransaction(async (tx) => {
    const [existingLock, existingTx] = await Promise.all([tx.get(lockRef), tx.get(txRef)]);
    if (existingLock.exists) throw new Error('CARD_ALREADY_SUBMITTED');
    if (existingTx.exists) throw new Error('REQUEST_ID_COLLISION');

    tx.create(txRef, {
      uid: input.uid,
      username: input.username ?? '',
      provider: 'nappay',
      requestId,
      telco: input.telco,
      declaredAmount: input.declaredAmount,
      cardFingerprint: fp,
      codeEncrypted: encryptSecret(input.code),
      serialEncrypted: encryptSecret(input.serial),
      codeMasked: `${input.code.slice(0, 2)}••••${input.code.slice(-2)}`,
      serialMasked: `${input.serial.slice(0, 2)}••••${input.serial.slice(-2)}`,
      status: 'submitted',
      statusLabel: 'SUBMITTED',
      providerStatus: 0,
      createdAt,
      updatedAt: createdAt,
    });

    tx.create(lockRef, {
      requestId,
      uid: input.uid,
      createdAt,
    });
  });

  return requestId;
}

export async function saveProviderState(
  requestId: string,
  data: JsonRecord,
  extra: JsonRecord = {},
) {
  const db = getAdminDb();
  const ref = db.collection('cardTransactions').doc(requestId);
  const status = num(data.status);
  const current = await ref.get();
  if (!current.exists) throw new Error('TRANSACTION_NOT_FOUND');

  const patch: JsonRecord = {
    providerStatus: status,
    statusLabel: statusLabel(status),
    providerMessage: clean(data.message),
    transId: data.trans_id ?? null,
    realValue: num(data.value),
    receiveAmount: num(data.amount ?? data.receive_amount),
    declaredValueFromProvider: num(data.declared_value),
    updatedAt: nowIso(),
    ...extra,
  };

  if (current.get('status') !== 'credited') {
    if (status === 99) patch.status = 'pending';
    else if (status === 1) patch.status = 'provider_success';
    else if (status === 2) patch.status = 'wrong_value';
    else if (status === 3) patch.status = 'invalid_card';
    else if (status === 4) patch.status = 'maintenance';
    else if (status === 101) patch.status = 'transaction_not_found';
    else if (status >= 100) patch.status = 'failed';
    else patch.status = 'failed';
  }

  await ref.set(patch, { merge: true });
  return patch;
}

export async function markUnknown(requestId: string, message: string) {
  await getAdminDb().collection('cardTransactions').doc(requestId).set(
    {
      status: 'provider_unknown',
      statusLabel: 'PROVIDER_UNKNOWN',
      providerMessage: clean(message).slice(0, 500),
      updatedAt: nowIso(),
    },
    { merge: true },
  );
}

export async function creditByDeclaredAmount(requestId: string, providerData: JsonRecord): Promise<CardCreditResult> {
  const providerStatus = num(providerData.status);
  if (providerStatus !== 1) return { credited: false, alreadyCredited: false, amount: 0 };

  const db = getAdminDb();
  const txRef = db.collection('cardTransactions').doc(requestId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(txRef);
    if (!snap.exists) throw new Error('TRANSACTION_NOT_FOUND');
    const data = snap.data() ?? {};

    if (data.status === 'credited' || data.creditedAt) {
      return { credited: false, alreadyCredited: true, amount: num(data.creditedAmount) };
    }

    const declaredAmount = num(data.declaredAmount);
    const providerValue = num(providerData.value || providerData.declared_value);
    if (!declaredAmount) throw new Error('DECLARED_AMOUNT_MISSING');

    if (!providerValue || providerValue !== declaredAmount) {
      tx.update(txRef, {
        status: 'wrong_value',
        statusLabel: 'CARD_WRONG_VALUE',
        providerStatus: 2,
        realValue: providerValue,
        receiveAmount: num(providerData.amount || providerData.receive_amount),
        providerMessage: `Sai mệnh giá khai báo. Đã chọn ${declaredAmount}, NAPPAY xác nhận ${providerValue}.`,
        updatedAt: nowIso(),
      });
      return { credited: false, alreadyCredited: false, amount: 0, wrongValue: true, actualValue: providerValue };
    }

    const uid = clean(data.uid);
    if (!uid) throw new Error('TRANSACTION_USER_MISSING');

    const userRef = db.collection('users').doc(uid);
    const userSnap = await tx.get(userRef);
    const user = userSnap.exists ? userSnap.data() ?? {} : {};
    const oldBalance = num(user.balance);
    const oldTopup = num(user.totalTopup);
    const oldDeposited = num(user.totalDeposited);
    const newBalance = oldBalance + declaredAmount;

    tx.set(
      userRef,
      {
        uid,
        balance: newBalance,
        totalTopup: oldTopup + declaredAmount,
        totalDeposited: oldDeposited + declaredAmount,
        updatedAt: nowIso(),
      },
      { merge: true },
    );

    tx.update(txRef, {
      status: 'credited',
      statusLabel: 'VALID_CARD',
      providerStatus: 1,
      realValue: providerValue,
      receiveAmount: num(providerData.amount || providerData.receive_amount),
      creditedAmount: declaredAmount,
      creditedAt: nowIso(),
      updatedAt: nowIso(),
      providerMessage: clean(providerData.message),
      transId: providerData.trans_id ?? null,
      creditMode: 'DECLARED_FACE_VALUE',
    });

    const transactionRef = userRef.collection('transactions').doc();
    tx.create(transactionRef, {
      type: 'deposit',
      method: 'nappay_card',
      provider: 'nappay',
      amount: declaredAmount,
      depositId: requestId,
      transactionId: requestId,
      providerReference: providerData.trans_id ?? null,
      balanceBefore: oldBalance,
      balanceAfter: newBalance,
      createdAt: Date.now(),
    });

    const notificationRef = userRef.collection('notifications').doc();
    tx.create(notificationRef, {
      type: 'deposit',
      title: 'Nạp thẻ thành công',
      body: `Ví đã được cộng ${declaredAmount.toLocaleString('vi-VN')}đ.`,
      depositId: requestId,
      read: false,
      createdAt: Date.now(),
    });

    return {
      credited: true,
      alreadyCredited: false,
      amount: declaredAmount,
      newBalance,
    };
  });
}

export async function getTransaction(requestId: string) {
  const snap = await getAdminDb().collection('cardTransactions').doc(requestId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as JsonRecord) } as JsonRecord;
}

export async function checkTransaction(requestId: string) {
  const tx = await getTransaction(requestId);
  if (!tx) throw new Error('TRANSACTION_NOT_FOUND');
  if (tx.status === 'credited') {
    return {
      tx,
      provider: { status: 1, value: tx.realValue || tx.declaredAmount },
      credit: { credited: false, alreadyCredited: true, amount: num(tx.creditedAmount) },
    };
  }

  const { partnerId, partnerKey } = requireNappayConfig();
  const sign = checkSign({ partnerKey, partnerId, requestId });
  const result = await nappayRequest({
    command: 'check',
    partner_id: partnerId,
    request_id: requestId,
    sign,
  });

  await saveProviderState(requestId, result.data, {
    providerEndpoint: result.endpoint,
    lastCheckedAt: nowIso(),
  });
  const credit = await creditByDeclaredAmount(requestId, result.data);
  const latest = await getTransaction(requestId);
  return { tx: latest, provider: result.data, credit, endpoint: result.endpoint };
}

export async function submitCard(input: {
  uid: string;
  username?: string;
  telco: string;
  amount: number;
  code: string;
  serial: string;
}) {
  const { partnerId, partnerKey } = requireNappayConfig();
  const requestId = await createTransaction({
    uid: input.uid,
    username: input.username,
    telco: input.telco,
    declaredAmount: input.amount,
    code: input.code,
    serial: input.serial,
  });
  const sign = chargingSign({
    partnerKey,
    code: input.code,
    partnerId,
    requestId,
    serial: input.serial,
    telco: input.telco,
  });

  try {
    const result = await nappayRequest({
      command: 'charging',
      partner_id: partnerId,
      request_id: requestId,
      telco: input.telco,
      amount: String(input.amount),
      serial: input.serial,
      code: input.code,
      sign,
    });

    await saveProviderState(requestId, result.data, { providerEndpoint: result.endpoint });
    const status = num(result.data.status);
    const credit = await creditByDeclaredAmount(requestId, result.data);
    return {
      requestId,
      status,
      statusLabel: statusLabel(status),
      provider: result.data,
      credit,
      endpoint: result.endpoint,
    };
  } catch (error) {
    await markUnknown(requestId, error instanceof Error ? error.message : 'NAPPAY_NETWORK_ERROR');
    return {
      requestId,
      status: 99,
      statusLabel: 'PENDING',
      providerUnknown: true,
      message: 'Chưa nhận được phản hồi trực tiếp từ NAPPAY. Giao dịch đã được giữ lại để kiểm tra bằng request_id.',
    };
  }
}

export function verifyCallbackSignature(input: { code: string; serial: string; actual: string }) {
  const partnerKey = clean(process.env.NAPPAY_PARTNER_KEY);
  if (!partnerKey) throw new Error('NAPPAY_NOT_CONFIGURED');
  const expected = callbackSign({ partnerKey, code: input.code, serial: input.serial });
  const a = Buffer.from(clean(input.actual).toLowerCase(), 'utf8');
  const b = Buffer.from(expected.toLowerCase(), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function decryptCardSecret(value: string) {
  return decryptSecret(value);
}
