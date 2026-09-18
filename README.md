# Lù A Vang — ACC + FILE DIGITAL Store

Production-oriented Next.js 16 + React 19.3 + TypeScript 6 storefront for ACC and digital files. The UI is dark, neon, glass-heavy and intentionally avoids a white corporate/template aesthetic.

## Architecture

- **Frontend:** Next.js App Router, React, Tailwind CSS 4, Framer Motion, Lucide, Zustand, React Hook Form/Zod-ready validation, Sonner.
- **Auth:** Firebase Authentication with email/password and Google. The provider layer is intentionally isolated so Apple/GitHub/Facebook can be added later.
- **Database:** Firestore. Trusted mutations are performed by server-only handlers under `server/routes/**` using Firebase Admin SDK.
- **Files:** Firebase Storage private paths; downloads use short-lived signed URLs.
- **Payments:** provider adapters under `services/payments/`. No secret is exposed to browser code.
- **Deploy:** Vercel. HTTP APIs are top-level Vercel Functions under `api/**`, so their public URLs remain `/api/...`.

## Payment integration

The payment adapters in this build use the working NAPPay and SePay contracts supplied with the project.

### NAPPay card top-up

The card flow uses the NAPPay charging endpoint, server-side signing and callback verification. The server never exposes partner credentials, PIN or serial to the browser after submission. Duplicate cards are locked by a server-side fingerprint, pending requests can be checked again, and wallet credit only occurs after a successful provider response with the exact declared denomination.

### SePay bank transfer

The bank-transfer flow creates a unique `NAP...` payment code and a VietQR-compatible image URL. The webhook verifies `x-sepay-signature` and `x-sepay-timestamp`, matches the payment code, amount and configured bank account, then credits the user's wallet idempotently.

Before live use, configure the real provider credentials and webhook settings in Vercel Environment Variables.

## Local installation

```bash
npm install
npm run dev
```

`npm run dev` runs the Next.js frontend. Because the HTTP API is intentionally outside `app/` in the top-level `api/**` directory, use the Vercel CLI for a full local stack:

```bash
npm install -g vercel
vercel dev
```

That local Vercel environment serves the same `/api/...` function URLs used in production.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

## Firebase setup

1. Install Firebase CLI if needed: `npm install -g firebase-tools`.
2. Create a Firebase project.
3. Enable Authentication providers: Email/Password and Google.
4. Create a Firestore database.
5. Create a Storage bucket.
6. Deploy `firestore.rules`, `firestore.indexes.json` and `storage.rules` using Firebase CLI.
7. Add your Vercel domain to Firebase Authentication **Authorized domains**.
8. Create a Firebase Admin service account and place its server-only values in Vercel Environment Variables.

## Environment variables

Copy `.env.example` to `.env.local` and fill only real values.

`NEXT_PUBLIC_*` values are public browser config.

`FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` are server-only.

`SEPAY_*` and `NAPPAY_*` are server-only.

For `FIREBASE_PRIVATE_KEY`, preserve line breaks as `\\n` if the platform stores the key in one line.

## Admin setup

Do not register an admin through the UI.

After the user has registered and you know the Firebase UID:

```bash
npm run set-admin -- YOUR_FIREBASE_UID
```

The script sets Firebase custom claim `admin=true` and synchronizes the user document role. The browser must refresh its ID token (normally a new login or forced refresh) before the admin UI appears.

Server routes check the custom claim, not a client-supplied `role` field.

## Data model

```text
users/{uid}
  users/{uid}/orders/{orderId}
  users/{uid}/transactions/{transactionId}
  users/{uid}/notifications/{notificationId}
  users/{uid}/favorites/{productId}

products/{productId}
  products/{productId}/inventory/{itemId}

orders/{orderId}
deliveries/{deliveryId}
deposits/{depositId}
vouchers/{CODE}/uses/{uid}
providerEvents/{externalId}
```

### Inventory

ACC inventory is private. An order transaction queries unsold inventory, marks the selected items as sold with the order ID, records delivery and decrements product stock in the same transaction.

### Digital files

Files are uploaded to a private Storage path such as:

```text
private/products/{productId}/{uuid}-filename.ext
```

Users do not get direct Storage access. The order API issues signed URLs with short expiry after authorization.

## Checkout security

The repository includes an in-memory best-effort rate limiter per Vercel instance. For distributed production rate limiting, back it with a shared store such as Vercel KV/Upstash before high-volume launch.

The client only submits product IDs, quantities and an optional voucher code. The server:

1. loads current product prices;
2. validates active status and inventory;
3. validates voucher limits/category/product restrictions;
4. checks the user wallet;
5. locks ACC inventory in a Firestore transaction;
6. creates the order and delivery records;
7. records the purchase transaction;
8. updates user/product totals;
9. creates a notification.

The server never trusts `price`, `balance`, `role` or payment status sent by the browser.

## Firestore rules

`firestore.rules` intentionally blocks direct client writes for sensitive data. Public catalog reads are limited to active products; user-scoped reads are allowed for the authenticated owner's subcollections. Sensitive mutations go through trusted server routes.

## API architecture

The repository deliberately does **not** use `app/api/**`. Each API URL has a matching Vercel Function in `api/**`, while reusable business logic lives in `server/routes/**`. For example:

```text
/api/products            -> api/products.ts
/api/orders/123          -> api/orders/[id].ts
/api/nappay/callback     -> api/nappay/callback.ts
/api/webhook/sepay       -> api/webhook/sepay.ts
```

The client therefore keeps calling `/api/...` exactly as before; only the server-side implementation location changed.

## Production deployment on Vercel

```bash
vercel
```

Add all required Environment Variables for **Development / Preview / Production** as appropriate.

Set:

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

Then verify:

- Firebase Authorized Domains contains your Vercel domain.
- Google OAuth uses the Firebase provider configuration.
- Firebase Admin credentials work on Vercel.
- Storage bucket is correct.
- SePay/NAPPay adapters require the real provider credentials and webhook settings before live traffic is enabled.
- `npm run build` succeeds.

## Troubleshooting

### Firebase Admin: Invalid PEM formatted message

Make sure `FIREBASE_PRIVATE_KEY` contains the complete service-account key and `\\n` line breaks are converted by the server helper.

### Firestore missing index

Use the generated `firestore.indexes.json` and deploy it. If Firebase reports a new required composite index after a schema/query change, add the indicated index before production rollout.

### OAuth domain error

Add both localhost (during local development when required) and the production Vercel domain under Firebase Authentication Authorized domains.

### Payment stays pending

This is expected until the official provider webhook/request contract is configured. No frontend-only success path exists.

## No default products

This repository does not automatically seed demo products in production. Admins create products explicitly through `/admin/products`.

## Branding

Shop name: **Lù A Vang**

Footer: **© Lù A Vang**

## Production baseline

The project follows the attached Lù A Vang production specification: dark premium neon UI, Firebase Authentication/Firestore/Storage, server-side checkout validation, private ACC inventory, private digital-file delivery, SePay idempotent webhooks, NAPPay server adapter, server-only secrets, and explicit build/security verification. Public API URLs remain `/api/...`, while the Vercel function files live in the root `api/**` directory.


## API route map

`/api/...` is preserved in the browser. The implementation files are outside `app/`:

```text
/api/products                  -> api/products.ts
/api/orders/:id                -> api/orders/[id].ts
/api/deposits/history          -> api/deposits/history.ts
/api/payments/sepay/webhook    -> api/payments/sepay/webhook.ts
/api/payments/nappay/card      -> api/payments/nappay/card.ts
/api/payments/nappay/callback  -> api/payments/nappay/callback.ts
```
