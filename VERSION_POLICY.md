# Version policy

This production baseline tracks current stable package releases where the ecosystem is compatible.

- Next.js / eslint-config-next: 16.3.5
- React / React DOM: 19.3.0
- ESLint: 10.10.0
- TypeScript: 6.0.3 (latest compatible line for the current TypeScript ESLint toolchain; TypeScript 7.x is not used until that peer range supports it)
- Node runtime on Vercel: 24.x
- Tailwind CSS / PostCSS: 4.3.3
- Framer Motion: 13.3.0
- Firebase JS SDK: 12.19.0
- Firebase Admin SDK: 14.4.0

Do not run automated major-version bumps blindly. Re-check peer compatibility before updating the stack.
