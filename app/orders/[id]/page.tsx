'use client';

import Link from 'next/link';
import { Download, KeyRound } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatDate, formatVnd } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import type { OrderDetailData } from '@/types/admin';

export default function OrderDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<OrderDetailData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const json: { ok?: boolean; data?: OrderDetailData } = await response.json();
        if (!cancelled && json.ok) setData(json.data ?? null);
      } catch {
        if (!cancelled) setData(null);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [user, id]);

  async function download() {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch(`/api/orders/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const json: { ok?: boolean; data?: { urls?: Array<{ url: string; fileName: string }> }; error?: { message?: string } } = await response.json();
    if (!json.ok) { toast.error(json.error?.message ?? 'Không thể cấp link.'); return; }
    for (const file of json.data?.urls ?? []) {
      const anchor = document.createElement('a');
      anchor.href = file.url;
      anchor.download = file.fileName;
      anchor.target = '_blank';
      anchor.click();
    }
    toast.success('Đã cấp link tải có hạn.');
  }

  return <Container className="py-12">{!data ? <div className="animate-pulse text-white/30">Đang tải đơn...</div> : <><div className="mb-8"><Link href="/orders" className="text-xs text-white/35">← Đơn hàng</Link><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs uppercase tracking-[.2em] text-cyan-300/60">Order</div><h1 className="mt-1 text-3xl font-black">#{data.order.id}</h1></div><Badge className="text-green-200">{data.order.status}</Badge></div></div><div className="grid gap-6 lg:grid-cols-[1fr_360px]"><div className="space-y-3">{data.order.items.map((item) => <div key={item.productId} className="lv-glass rounded-2xl p-5"><div className="font-bold">{item.name}</div><div className="mt-2 text-xs text-white/35">{item.category} × {item.quantity}</div>{data.deliveries.filter((delivery) => delivery.productId === item.productId).map((delivery) => <div key={delivery.id} className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">{delivery.category === 'acc' ? <><div className="flex items-center gap-2 text-green-300"><KeyRound className="h-4 w-4" />Thông tin ACC</div><div className="mt-3 grid gap-2 text-sm"><div><span className="text-white/30">Username:</span> {delivery.username ?? delivery.credential ?? '—'}</div><div><span className="text-white/30">Password:</span> {delivery.password ?? '—'}</div>{delivery.note && <div><span className="text-white/30">Note:</span> {delivery.note}</div>}</div></> : <div className="flex items-center justify-between gap-3"><div><div className="font-semibold">{delivery.fileName}</div><div className="mt-1 text-xs text-white/35">Link tải có thời hạn</div></div><Button variant="secondary" onClick={() => void download()}><Download className="h-4 w-4" />Tải file</Button></div>}</div>)}</div>)}</div><div className="lv-glass h-fit rounded-2xl p-6"><div className="text-xs uppercase tracking-[.18em] text-white/30">Summary</div><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-white/45">Tạm tính</span><span>{formatVnd(data.order.subtotal)}</span></div><div className="flex justify-between text-pink-200"><span>Giảm</span><span>-{formatVnd(data.order.discount)}</span></div><div className="my-3 h-px bg-white/10" /><div className="flex justify-between font-black"><span>Tổng</span><span>{formatVnd(data.order.total)}</span></div><div className="pt-2 text-xs text-white/30">{formatDate(data.order.createdAt)}</div></div></div></div></>}</Container>;
}
