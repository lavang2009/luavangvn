import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const nextConfig = Array.isArray(nextVitals) ? nextVitals : [nextVitals];

export default defineConfig([
  ...nextConfig,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);
