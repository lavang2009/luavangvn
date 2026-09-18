# Lua Vang Shop - Build Audit Fix 4

## Fixed in this release

- Removed the unsafe optional `Promise<Response> | undefined` promise chains from Firebase token loading in all affected client/admin pages.
- Converted those auth-loading effects to `async/await` with explicit null checks and cancellation guards.
- Fixed `app/admin/inventory/page.tsx` so `token()` returns `Promise<string | null>` and no optional string can leak into a `.then()` chain.
- Fixed `app/admin/page.tsx` for the same optional-token issue.
- Fixed related auth fetch chains in Navbar, AdminShell, Settings, Profile, Favorites, Deposit History, Orders, Order Detail and AuthProvider.
- Restored the official Next.js flat ESLint configuration import form without `.js` suffixes.
- Kept the top-level Vercel Functions architecture (`/api/**`) and `app/api` removed.
- Kept the NAPPAY/SePay API logic and endpoint URLs unchanged.

## Structural checks

- Root `api/` functions: 31
- `server/routes/` handlers: 31
- `app/api/`: 0
- Legacy `next/server` / `@/app/api` references: 0
- JS/MJS syntax check: passed
- TS/TSX syntax/transpile check (excluding generated `next-env.d.ts`): passed

## Build note

A complete `npm install`/`next build` cannot be executed in this environment because the npm registry is not reachable and there is no `node_modules` cache for this project. The source checks above are therefore static/syntax checks, not a claim of a remote Vercel build success.
