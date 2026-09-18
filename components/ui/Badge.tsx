import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full border border-white/10 bg-white/[.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-white/70', className)}>{children}</span>;
}
