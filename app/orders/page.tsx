'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect, useState } from 'react';
import { formatDate, formatVnd } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { OrderStatus, ProductCategory } from '@/types/shop';

interface OrderListRow {
  orderId: string;
  total: number;
  status: OrderStatus;
  createdAt: number;
  items?: Array<{ name: string; category: ProductCategory; quantity: number }>;
}

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<OrderListRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const json: { ok?: boolean; data?: { items?: OrderListRow[] } } = await response.json();
        if (!cancelled && json.ok) setItems(json.data?.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <Container className="py-12">Loading...</Container>;
  if (!user) return <Container className="py-12"><Link href="/login" className="text-cyan-300">Đăng nhập để xem đơn hàng.</Link></Container>;

  return <Container className="py-12"><div className="mb-8"><div className="text-xs font-black uppercase tracking-[.24em] text-purple-300/70">Orders</div><h1 className="mt-2 text-4xl font-black">Đơn hàng</h1></div><div className="space-y-3">{items.map((order) => <Link key={order.orderId} href={`/orders/${order.orderId}`} className="lv-glass block rounded-2xl p-5 hover:border-purple-400/20"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="font-black">#{order.orderId}</div><div className="mt-1 text-xs text-white/35">{order.items?.map((item) => item.name).join(', ')}</div></div><div className="text-right"><div className="font-black">{formatVnd(Number(order.total || 0))}</div><Badge className="mt-2 text-green-200">{order.status}</Badge><div className="mt-1 text-xs text-white/30">{formatDate(Number(order.createdAt))}</div></div></div></Link>)}{!items.length && <div className="lv-glass rounded-2xl p-12 text-center text-white/35">Chưa có đơn.</div>}</div></Container>;
}
