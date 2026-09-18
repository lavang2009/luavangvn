import crypto from 'node:crypto';

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function normalizePaymentCode(value: unknown) {
  const raw = clean(value).toUpperCase();
  if (!raw) return '';
  const code = raw.replace(/^NAP[_-]?/, 'NAP');
  return /^NAP[A-Z0-9]{6,}$/.test(code) ? code : '';
}

function extractPaymentCode(payload: Record<string, unknown>) {
  const fromCode = normalizePaymentCode(payload.code);
  if (fromCode) return fromCode;

  const content = clean(payload.content).toUpperCase();
  const match = content.match(/NAP[_-]?[A-Z0-9]{6,}/i);
  return match ? normalizePaymentCode(match[0]) : '';
}

export function createPaymentCode() {
  return `NAP${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

export function isSePayConfigured() {
  return Boolean(clean(process.env.BANK_ACCOUNT) && (clean(process.env.SEPAY_WEBHOOK_SECRET) || clean(process.env.SEPAY_API_KEY)));
}

export function verifySePaySignature(rawBody: string, headers: Headers) {
  const secret = clean(process.env.SEPAY_WEBHOOK_SECRET);
  const apiKey = clean(process.env.SEPAY_API_KEY);

  const secretHeader = clean(headers.get('x-secret-key'));
  if (secret && secretHeader && secretHeader === secret) return { ok: true, status: 200 };

  const authorization = clean(headers.get('authorization'));
  if (apiKey && authorization.startsWith('Apikey ') && authorization.slice(7).trim() === apiKey) {
    return { ok: true, status: 200 };
  }

  const signature = clean(headers.get('x-sepay-signature'));
  const timestamp = clean(headers.get('x-sepay-timestamp'));
  if (secret && signature && timestamp) {
    const ts = Number(timestamp);
    if (Number.isFinite(ts)) {
      const age = Math.abs(Date.now() - ts * 1000);
      if (age <= 5 * 60 * 1000) {
        const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length === b.length && crypto.timingSafeEqual(a, b)) return { ok: true, status: 200 };
      }
    }
  }

  if (process.env.SEPAY_ALLOW_UNSIGNED_WEBHOOK === 'true') return { ok: true, status: 200 };
  return { ok: false, status: 401, message: 'Webhook SePay chưa vượt qua xác thực.' };
}

export async function createSePayDepositPayload(amount: number, paymentCode: string) {
  const account = clean(process.env.BANK_ACCOUNT);
  const bank = clean(process.env.BANK_CODE || 'MB').replace(/[^a-zA-Z0-9]/g, '');
  const accountName = clean(process.env.BANK_ACCOUNT_NAME);
  const bankName = clean(process.env.BANK_NAME || bank);
  const template = clean(process.env.SEPAY_QR_TEMPLATE || 'compact2') || 'compact2';

  if (!account || !bank) {
    return {
      configured: false,
      qrDataUrl: null,
      bankInfo: { bank: bankName, account, accountName, paymentCode },
    };
  }

  // VietQR Quick Link: documented image URL with amount, transfer content and account name.
  const qrUrl = new URL(`https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(account)}-${encodeURIComponent(template)}.jpg`);
  qrUrl.searchParams.set('amount', String(amount));
  qrUrl.searchParams.set('addInfo', paymentCode);
  if (accountName) qrUrl.searchParams.set('accountName', accountName);

  return {
    configured: true,
    qrDataUrl: qrUrl.toString(),
    bankInfo: { bank: bankName, account, accountName, paymentCode },
  };
}

export async function processSePayPayload(payload: Record<string, unknown>) {
  const eventData = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data as Record<string, unknown>
    : payload;
  const transferType = clean(eventData.transferType).toLowerCase();
  if (transferType !== 'in') return { success: true, ignored: true, reason: 'not_incoming' };

  const externalId = clean(eventData.id || eventData.referenceCode);
  if (!externalId) return { success: false, status: 400, message: 'Missing transaction id' };

  const paymentCode = extractPaymentCode(eventData);
  if (!paymentCode) {
    return {
      success: false,
      status: 422,
      message: 'Không tìm thấy mã thanh toán NAP.',
      reason: 'payment_code_not_found',
      externalId,
    };
  }

  const db = (await import('@/lib/firebase/admin')).getAdminDb();
  const processedRef = db.collection('processedTransactions').doc(externalId);
  const existing = await processedRef.get();
  if (existing.exists) return { success: true, duplicate: true, externalId };

  const depositSnap = await db
    .collection('deposits')
    .where('paymentCode', '==', paymentCode)
    .limit(1)
    .get();

  if (depositSnap.empty) {
    return {
      success: false,
      status: 422,
      message: 'Không tìm thấy đơn nạp tương ứng.',
      reason: 'deposit_not_found',
      paymentCode,
      externalId,
    };
  }

  const depositRef = depositSnap.docs[0].ref;
  const deposit = depositSnap.docs[0].data() as Record<string, unknown>;
  const depositId = depositSnap.docs[0].id;

  const amount = Number(eventData.transferAmount || 0);
  const expectedAmount = Number(deposit.amount ?? deposit.requestedAmount ?? 0);

  if (amount !== expectedAmount) {
    return {
      success: false,
      status: 422,
      message: 'Số tiền chuyển khoản không khớp.',
      receivedAmount: amount,
      expectedAmount,
      paymentCode,
      externalId,
    };
  }

  const expectedAccount = clean(process.env.BANK_ACCOUNT);
  const receivedAccount = clean(eventData.accountNumber);
  if (expectedAccount && receivedAccount && expectedAccount !== receivedAccount) {
    return {
      success: false,
      status: 422,
      message: 'Tài khoản ngân hàng nhận không khớp.',
      paymentCode,
      externalId,
    };
  }

  const userRef = db.collection('users').doc(String(deposit.userId));
  const transactionRef = db.collection('transactions').doc(externalId);
  const now = nowIso();

  await db.runTransaction(async (tx) => {
    const processedSnap = await tx.get(processedRef);
    if (processedSnap.exists) return;

    const currentDepositSnap = await tx.get(depositRef);
    if (!currentDepositSnap.exists) throw new Error('DEPOSIT_NOT_FOUND');

    const currentDeposit = currentDepositSnap.data() ?? {};
    if (currentDeposit.status === 'paid' || currentDeposit.status === 'success') {
      tx.create(processedRef, { transactionId: externalId, depositId, processedAt: now });
      return;
    }

    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new Error('USER_NOT_FOUND');
    const currentUser = userSnap.data() ?? {};

    const oldBalance = Number(currentUser.balance ?? 0);
    const newBalance = oldBalance + amount;
    const oldTotalDeposited = Number(currentUser.totalDeposited ?? 0);
    const oldTotalTopup = Number(currentUser.totalTopup ?? 0);

    tx.set(
      userRef,
      {
        balance: newBalance,
        totalDeposited: oldTotalDeposited + amount,
        totalTopup: oldTotalTopup + amount,
        updatedAt: Date.now(),
      },
      { merge: true },
    );

    tx.set(
      depositRef,
      {
        ...currentDeposit,
        status: 'success',
        amount,
        paidAt: now,
        processedAt: now,
        transactionId: externalId,
        referenceCode: eventData.referenceCode || null,
        gateway: eventData.gateway || null,
        accountNumber: eventData.accountNumber || null,
        sepayId: eventData.id ?? null,
        updatedAt: Date.now(),
      },
      { merge: true },
    );

    tx.create(processedRef, {
      transactionId: externalId,
      depositId,
      processedAt: now,
    });

    tx.set(
      transactionRef,
      {
        userId: String(deposit.userId),
        type: 'deposit',
        method: 'sepay_bank',
        provider: 'sepay',
        amount,
        balanceBefore: oldBalance,
        balanceAfter: newBalance,
        totalDepositedBefore: oldTotalDeposited,
        totalDepositedAfter: oldTotalDeposited + amount,
        totalTopupBefore: oldTotalTopup,
        totalTopupAfter: oldTotalTopup + amount,
        status: 'completed',
        paymentCode,
        referenceCode: eventData.referenceCode || null,
        gateway: eventData.gateway || null,
        accountNumber: eventData.accountNumber || null,
        createdAt: Date.now(),
      },
      { merge: true },
    );

    const notificationRef = userRef.collection('notifications').doc();
    tx.create(notificationRef, {
      type: 'deposit',
      title: 'Nạp tiền thành công',
      body: `Ví đã được cộng ${amount.toLocaleString('vi-VN')}đ.`,
      depositId,
      read: false,
      createdAt: Date.now(),
    });
  });

  return {
    success: true,
    credited: amount,
    paymentCode,
    depositId,
    transactionId: externalId,
  };
}

