import crypto from 'node:crypto';

const VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;

function getKey() {
  const value = String(process.env.APP_ENCRYPTION_KEY ?? '').trim();
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new Error('APP_ENCRYPTION_KEY_INVALID');
  const key = Buffer.from(value, 'hex');
  if (key.length !== KEY_BYTES) throw new Error('APP_ENCRYPTION_KEY_INVALID');
  return key;
}

function b64urlEncode(value: Buffer) {
  return value.toString('base64url');
}

function b64urlDecode(value: string) {
  return Buffer.from(value, 'base64url');
}

export function encryptSecret(plaintext: string) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext ?? ''), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, b64urlEncode(iv), b64urlEncode(tag), b64urlEncode(ciphertext)].join('.');
}

export function decryptSecret(payload: string) {
  const parts = String(payload ?? '').split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error('ENCRYPTED_SECRET_INVALID');

  const key = getKey();
  const iv = b64urlDecode(parts[1]);
  const tag = b64urlDecode(parts[2]);
  const ciphertext = b64urlDecode(parts[3]);

  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) {
    throw new Error('ENCRYPTED_SECRET_INVALID');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
