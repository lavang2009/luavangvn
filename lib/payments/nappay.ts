import crypto from 'node:crypto';

export const TELCO_CONFIG = {
  VIETTEL: { codeLength: 15, serialMin: 5, serialMax: 25 },
  VINAPHONE: { codeLength: 14, serialMin: 5, serialMax: 25 },
  MOBIFONE: { codeLength: 12, serialMin: 5, serialMax: 25 },
  VNMOBI: { codeLength: 12, serialMin: 5, serialMax: 25 },
} as const;

export const CARD_AMOUNTS = new Set([
  10000,
  20000,
  30000,
  50000,
  100000,
  200000,
  300000,
  500000,
  1000000,
]);

const DEFAULT_ENDPOINT = 'https://app.nappay.vn/chargingws/v2';

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function md5(value: string) {
  return crypto.createHash('md5').update(value, 'utf8').digest('hex');
}

function timeoutMs() {
  return Math.min(Math.max(Number(process.env.NAPPAY_TIMEOUT_MS ?? 15000), 5000), 30000);
}

export function getNappayEndpoint() {
  return clean(process.env.NAPPAY_ENDPOINT || DEFAULT_ENDPOINT) || DEFAULT_ENDPOINT;
}

export function requireNappayConfig() {
  const partnerId = clean(process.env.NAPPAY_PARTNER_ID);
  const partnerKey = clean(process.env.NAPPAY_PARTNER_KEY);
  if (!partnerId || !partnerKey) throw new Error('NAPPAY_NOT_CONFIGURED');
  return { partnerId, partnerKey };
}

export function chargingSign(input: {
  partnerKey: string;
  code: string;
  partnerId: string;
  requestId: string;
  serial: string;
  telco: string;
}) {
  return md5(input.partnerKey + input.code + 'charging' + input.partnerId + input.requestId + input.serial + input.telco);
}

export function checkSign(input: {
  partnerKey: string;
  partnerId: string;
  requestId: string;
}) {
  return md5(input.partnerKey + 'check' + input.partnerId + input.requestId);
}

export function callbackSign(input: {
  partnerKey: string;
  code: string;
  serial: string;
}) {
  return md5(input.partnerKey + input.code + input.serial);
}

export function statusLabel(status: number) {
  const labels: Record<number, string> = {
    1: 'VALID_CARD',
    2: 'CARD_WRONG_VALUE',
    3: 'INVALID_CARD',
    4: 'MAINTENANCE',
    99: 'PENDING',
    100: 'REQUEST_ERROR',
    101: 'TRANSACTION_NOT_FOUND',
    102: 'AUTH_OR_DATA_ERROR',
    103: 'PROVIDER_EXCEPTION',
    104: 'INVALID_COMMAND',
  };
  return labels[status] ?? `ERROR_${status}`;
}

export async function nappayRequest(payload: Record<string, string>) {
  const endpoint = getNappayEndpoint();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs());

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        accept: 'application/json, text/plain, */*',
      },
      body: new URLSearchParams(payload).toString(),
      cache: 'no-store',
      signal: controller.signal,
    });

    const text = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      const error = new Error(`NAPPAY_NON_JSON_HTTP_${response.status}`);
      (error as Error & { httpStatus?: number }).httpStatus = response.status;
      throw error;
    }

    return {
      endpoint,
      httpStatus: response.status,
      data,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('NAPPAY_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function validateCardInput(telco: string, amount: number, code: string, serial: string) {
  const config = TELCO_CONFIG[telco as keyof typeof TELCO_CONFIG];
  if (!config) throw new Error('Nhà mạng không hợp lệ.');
  if (!CARD_AMOUNTS.has(amount)) throw new Error('Mệnh giá không hợp lệ.');
  if (!/^\d+$/.test(code) || code.length !== config.codeLength) {
    throw new Error(`Mã thẻ ${telco} phải có ${config.codeLength} chữ số.`);
  }
  if (!/^[A-Za-z0-9]+$/.test(serial) || serial.length < config.serialMin || serial.length > config.serialMax) {
    throw new Error('Số serial không hợp lệ.');
  }
}
