'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatDate, formatVnd } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import type { DepositHistoryRow } from '@/types/admin';

export default function DepositHistory() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<DepositHistoryRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/deposits', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const json: { ok?: boolean; data?: { items?: DepositHistoryRow[] } } = await response.json();
        if (!cancelled && json.ok) setItems(json.data?.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <Container className="py-12">Loading...</Container>;
  if (!user) return <Container className="py-12"><Link href="/login" className="text-cyan-300">Đăng nhập để xem lịch sử.</Link></Container>;

  return <Container className="py-12"><div className="mb-8"><div className="text-xs font-black uppercase tracking-[.24em] text-cyan-300/70">Deposit history</div><h1 className="mt-2 text-4xl font-black">Lịch sử nạp</h1></div><div className="space-y-3">{items.map((item) => <div key={item.depositId} className="lv-glass rounded-2xl p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="font-black">{formatVnd(Number(item.amount || item.requestedAmount || 0))}</div><div className="mt-1 text-xs text-white/35">{item.provider} • {item.paymentCode ?? item.depositId}</div></div><div className="text-right"><Badge className={item.status === 'success' ? 'text-green-200' : item.status === 'failed' || item.status === 'rejected' ? 'text-rose-200' : 'text-yellow-200'}>{item.status}</Badge><div className="mt-2 text-xs text-white/30">{formatDate(Number(item.createdAt))}</div></div></div></div>)}{!items.length && <div className="lv-glass rounded-2xl p-12 text-center text-white/35">Chưa có giao dịch.</div>}</div></Container>;
}
