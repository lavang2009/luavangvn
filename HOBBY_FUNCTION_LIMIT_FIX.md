# Hobby Function Limit Fix

## Why the deployment was blocked

The project previously had 33 separate files under `/api`, so Vercel could create more than the Hobby plan's 12-function deployment limit.

## What changed

- Removed the 33 individual Vercel Function entrypoints under `/api/**`.
- Added one catch-all entrypoint: `api/[...path].ts`.
- Preserved the public `/api/...` URLs by routing the request pathname to the existing `server/routes/**` handlers.
- Kept the existing Firebase, Firestore, NAPPay and SePay business logic outside the Vercel entrypoint.
- `vercel.json` now configures only the single catch-all function.

## API URLs preserved

The following families continue to resolve through the single function:

- `/api/admin/*`
- `/api/auth/*`
- `/api/deposits/*`
- `/api/downloads/*`
- `/api/favorites`
- `/api/health`
- `/api/nappay/callback`
- `/api/notifications`
- `/api/orders/*`
- `/api/payments/nappay/*`
- `/api/payments/sepay/webhook`
- `/api/products/*`
- `/api/profile`
- `/api/vouchers/validate`
- `/api/webhook/*`

## Important

The business handlers remain in `server/routes/**`; `api/[...path].ts` is only the Vercel transport/router layer.
