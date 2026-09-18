# Runtime Fix — 2026-09-18

## Fixed browser errors

- `/api/auth/bootstrap` and `/api/auth/me` 404: the Hobby catch-all router now accepts both Vercel request URL forms (with `/api` and function-local paths).
- `/api/products` 500: the public product query no longer depends on Firestore composite indexes; optional filters are applied in memory.
- `Unexpected token '<'` after `/api/products`: the shop page now handles non-JSON/error responses safely.
- Registration bootstrap failures no longer make a successfully-created Firebase Auth account appear to have failed; client profile bootstrap is attempted as a fallback.
- Firebase Auth error messages now explicitly identify common `400` causes such as invalid API key, disabled Email/Password provider, invalid email, password policy and configuration errors.
- Firebase Admin supports either the three server variables or a single `FIREBASE_SERVICE_ACCOUNT_JSON` secret.

## Vercel environment checklist

Public Firebase browser configuration:
`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.

Server Firebase Admin configuration:
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
or `FIREBASE_SERVICE_ACCOUNT_JSON`.

After deploy, test `/api/health`. A reachable JSON response confirms the single Hobby catch-all Function is reachable.
