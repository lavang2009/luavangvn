import { getAdminApp, getAdminDb } from '@/lib/firebase/admin';
import { ok } from '@/lib/api';

export async function GET() {
  let firebaseAdmin = false;
  let firestore = false;
  let firebaseError = '';
  try {
    getAdminApp();
    firebaseAdmin = true;
    getAdminDb();
    firestore = true;
  } catch (error) {
    firebaseError = error instanceof Error ? error.message : 'Firebase Admin unavailable.';
  }

  const encryptionKeyConfigured = /^[0-9a-fA-F]{64}$/.test(String(process.env.APP_ENCRYPTION_KEY ?? '').trim());
  const nappay = Boolean(process.env.NAPPAY_PARTNER_ID?.trim() && process.env.NAPPAY_PARTNER_KEY?.trim());
  const sepay = Boolean(process.env.BANK_ACCOUNT?.trim() && (process.env.SEPAY_WEBHOOK_SECRET?.trim() || process.env.SEPAY_API_KEY?.trim()));

  return ok({
    ok: true,
    firebaseAdmin,
    firestore,
    firebaseError: firebaseError || null,
    nappay,
    sepay,
    encryptionKeyConfigured,
    nappayEndpoint: String(process.env.NAPPAY_ENDPOINT || 'https://app.nappay.vn/chargingws/v2').trim(),
    callbacks: {
      nappay: '/api/nappay/callback',
      sepay: '/api/payments/sepay/webhook',
    },
  });
}
