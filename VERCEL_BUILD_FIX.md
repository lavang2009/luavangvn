# Vercel build baseline

This build baseline uses the current stable dependency set selected on 2026-09-18, with compatibility constraints documented in `VERSION_POLICY.md`.

- Next.js 16.3.5
- React 19.3.0 / React DOM 19.3.0
- ESLint 10.10.0 + eslint-config-next 16.3.5
- TypeScript 6.0.3 (latest supported by the current TypeScript ESLint parser range)
- Tailwind CSS 4.3.3 + @tailwindcss/postcss 4.3.3
- Framer Motion 13.3.0
- Firebase 12.19.0 / Firebase Admin 14.4.0

The project keeps API functions at the repository root under `api/**`, not under `app/api/**`. Each function delegates business logic to `server/routes/**`.

Build checks to run in CI/Vercel:

```text
npm install
npm run lint
npm run typecheck
npm run build
```

No TypeScript or ESLint errors are intentionally suppressed.
