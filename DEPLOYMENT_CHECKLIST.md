# Lù A Vang deployment checklist

## Build

- [ ] `npm install`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Node 24.x selected by `package.json`

## Firebase

- [ ] Authentication: Email/Password enabled
- [ ] Authentication: Google enabled
- [ ] Firestore created
- [ ] Storage bucket created
- [ ] `firestore.rules` deployed
- [ ] `firestore.indexes.json` deployed
- [ ] `storage.rules` deployed
- [ ] Vercel domain added to Firebase Authorized Domains
- [ ] Firebase Admin credentials stored only in Vercel server environment variables

## Payment

- [ ] SePay webhook secret configured
- [ ] Bank account/code/name configured
- [ ] NAPPay partner credentials configured
- [ ] NAPPay callback URL configured
- [ ] `APP_ENCRYPTION_KEY` configured as 64 hex characters
- [ ] Provider/webhook requests are verified before settlement
- [ ] Idempotency records are enabled and tested
- [ ] No frontend-only payment success state exists

## Admin

- [ ] Register a normal user first
- [ ] Set Firebase custom claim `admin=true` using `npm run set-admin -- <UID>`
- [ ] Refresh the user's Firebase ID token / log in again
- [ ] Confirm `/admin` is inaccessible to normal users

## Catalog and delivery

- [ ] No demo products seeded automatically
- [ ] ACC inventory imported by admin
- [ ] File products use private Storage paths
- [ ] Digital downloads return short-lived signed URLs only after a completed order
- [ ] Product price and stock are re-read server-side during checkout

## Vercel

- [ ] `NEXT_PUBLIC_SITE_URL=https://<your-domain>`
- [ ] All production environment variables are configured for Production
- [ ] `/api/health` returns the expected non-secret health state
- [ ] Test `/api/products`
- [ ] Test account registration/login
- [ ] Test wallet deposit creation
- [ ] Test provider webhook with a real provider sandbox/production event
- [ ] Test checkout and automatic delivery
