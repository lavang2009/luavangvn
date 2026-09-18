import { getAdminDb } from '@/lib/firebase/admin';
import { ok, fail } from '@/lib/api';

export async function GET() {
  try {
    getAdminDb();
    const encryption = /^[0-9a-fA-F]{64}$/.test(String(process.env.APP_ENCRYPTION_KEY ?? '').trim());
    const nappay = Boolean(process.env.NAPPAY_PARTNER_ID?.trim() && process.env.NAPPAY_PARTNER_KEY?.trim());
    const endpoint = String(process.env.NAPPAY_ENDPOINT || 'https://app.nappay.vn/chargingws/v2').trim();

    return ok({
      storage: 'firestore',
      firebaseAdmin: true,
      nappay,
      encryptionKeyConfigured: encryption,
      nappayEndpoint: endpoint,
      callbackUrl: '/api/nappay/callback',
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : 'Health check failed.',
      503,
      'HEALTHCHECK_FAILED',
    );
  }
}
