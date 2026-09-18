import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { BackgroundFX } from '@/components/layout/BackgroundFX';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/components/auth/AuthProvider';

export const metadata: Metadata = {
  title: { default: 'Lù A Vang — ACC + FILE DIGITAL', template: '%s — Lù A Vang' },
  description: 'Lù A Vang — cửa hàng ACC và FILE DIGITAL với ví tiền, thanh toán và giao hàng tự động.',
  applicationName: 'Lù A Vang',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://example.invalid')),
  openGraph: { title: 'Lù A Vang', description: 'Developer + Gaming + Premium + Neon Digital Store', type: 'website' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="vi"><body><AuthProvider><BackgroundFX /><Navbar /><main className="min-h-[calc(100vh-80px)]">{children}</main><Footer /><Toaster theme="dark" position="top-right" richColors /></AuthProvider></body></html>;
}
