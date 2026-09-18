# API Architecture — Lù A Vang

Production URLs use `/api/...` while function entrypoints live outside `app/`.

```text
api/                         Vercel Function entrypoints
server/routes/               Business and provider logic
services/payments/           SePay / NAPPay adapters
lib/firebase/                Firebase client/admin access
lib/db/                      Firestore business operations
```

There is intentionally no `app/api` directory.

Dynamic Vercel functions resolve path parameters from the request URL and use the shared adapter in `lib/vercel-handler.ts`.

Examples:

```text
/api/products
/api/orders
/api/orders/:id
/api/downloads/:orderId
/api/payments/sepay/webhook
/api/payments/nappay/card
/api/payments/nappay/callback
/api/admin/*
```

Secrets remain server-only. Client code calls these endpoints through relative `/api/...` URLs.
