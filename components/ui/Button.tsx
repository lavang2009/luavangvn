'use client';

import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Button({
  children,
  variant = 'primary',
  loading = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; loading?: boolean }) {
  const styles = {
    primary: 'bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white shadow-[0_12px_35px_rgba(92,92,255,.24)] hover:brightness-110',
    secondary: 'border border-white/10 bg-white/[.06] text-white hover:bg-white/[.1]',
    danger: 'bg-rose-500/15 text-rose-200 border border-rose-400/20 hover:bg-rose-500/25',
    ghost: 'text-white/65 hover:bg-white/[.06] hover:text-white',
  }[variant];
  return <button disabled={loading || props.disabled} className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50', styles, className)} {...props}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{children}</button>;
}
