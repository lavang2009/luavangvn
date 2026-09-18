# NAPPay + SePay integration

## NAPPay card top-up

Routes:

- POST `/api/payments/nappay/card`
- POST `/api/payments/nappay/card/check`
- GET `/api/payments/nappay/card/history`
- POST `/api/nappay/callback`
- POST `/api/webhook/nappay`
- GET `/api/admin/nappay/card`
- GET `/api/health`

Server environment:

```text
NAPPAY_PARTNER_ID=
NAPPAY_PARTNER_KEY=
NAPPAY_ENDPOINT=https://app.nappay.vn/chargingws/v2
NAPPAY_TIMEOUT_MS=15000
NAPPAY_CALLBACK_URL=https://YOUR_DOMAIN/api/nappay/callback
APP_ENCRYPTION_KEY=
```

Generate a valid encryption key with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The card flow stores encrypted PIN/serial on the server, blocks duplicate cards, supports provider callback and request checking, and only credits the selected face value when NAPPay confirms the same denomination.

## SePay bank transfer

Routes:

- POST `/api/deposits`
- GET `/api/deposits`
- POST `/api/payments/sepay/webhook`
- POST `/api/webhook/sepay`

Server environment:

```text
SEPAY_WEBHOOK_SECRET=
SEPAY_API_KEY=
SEPAY_ALLOW_UNSIGNED_WEBHOOK=false
SEPAY_QR_TEMPLATE=compact2
BANK_ACCOUNT=
BANK_CODE=MB
BANK_NAME=MBBank
BANK_ACCOUNT_NAME=
DEPOSIT_MIN=10000
DEPOSIT_MAX=50000000
```

SePay webhook is checked with `x-sepay-signature` and `x-sepay-timestamp`. The server matches the unique `NAP...` payment code, exact transfer amount and configured bank account before crediting the wallet.

## Deploy note

Do not put `NAPPAY_PARTNER_KEY`, `SEPAY_WEBHOOK_SECRET`, `APP_ENCRYPTION_KEY`, or Firebase Admin credentials in `NEXT_PUBLIC_*` variables.

After deploying, set the NAPPay callback URL in the provider configuration to:

```text
https://YOUR_DOMAIN/api/nappay/callback
```

Then test `/api/health` before submitting real payment data.

## Admin authorization

Server accepts Firebase custom claim `admin=true` and optional `ADMIN_UIDS` / `ADMIN_EMAILS` allowlists. If you set the Firestore user document role to `admin`, the server can also recognize it for compatibility.
