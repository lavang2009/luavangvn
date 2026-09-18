# Vercel Hobby Function Router Type Fix

The catch-all API adapter now requires route modules to accept `{ params: Record<string,string> }`, matching dynamic route handlers. This removes TS2345 incompatibilities without disabling TypeScript.
