# Security baseline

- No client authority over balance, role, order state, payment state, or product price.
- Firebase Admin SDK is server-only.
- ACC inventory is not readable by the client.
- Digital file Storage paths are private; downloads are signed and time-limited.
- NAPPay and SePay credentials stay in environment variables.
- Payment callbacks/webhooks are verified before settlement.
- Deposit and payment settlement use idempotent transaction records.
- Checkout re-reads product prices and stock on the server.
- Admin routes require Firebase custom claim `admin=true`.
- API errors exposed to the browser are sanitized; provider secrets and stack traces are not returned.
- Rate limiting is applied to checkout/top-up sensitive operations where implemented.
