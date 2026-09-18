'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatDate, formatVnd } from '@/lib/utils';
import { toast } from 'sonner';
import type { AdminOrderRow } from '@/types/admin';

export default function AdminOrders() {
  const [items, setItems] = useState<AdminOrderRow[]>([]);

  async function token() {
    const { firebaseAuth } = await import('@/lib/firebase/client');
    return firebaseAuth.currentUser?.getIdToken();
  }

  async function load() {
    const t = await token();
    if (!t) return;
    const response = await fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${t}` } });
    if (!response.ok) return;
    const json: { ok?: boolean; data?: { items?: AdminOrderRow[] } } = await response.json();
    if (json.ok) setItems(json.data?.items ?? []);
  }

  useEffect(() => { void load(); }, []);

  async function refund(id: string) {
    if (!confirm('Hoàn tiền đơn này?')) return;
    const t = await token();
    if (!t) return;
    const response = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refund', orderId: id }),
    });
    const json: { ok?: boolean; error?: { message?: string } } = await response.json();
    json.ok ? toast.success('Đã hoàn tiền.') : toast.error(json.error?.message ?? 'Không thể hoàn tiền.');
    void load();
  }

  return (
    <div>
      <h1 className="text-3xl font-black">Orders</h1>
      <div className="mt-6 space-y-3">
        {items.map((order) => (
          <div key={order.orderId} className="lv-glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-black">#{order.orderId}</div>
                <div className="mt-1 text-xs text-white/35">User {order.userId} • {formatDate(order.createdAt)}</div>
              </div>
              <div className="text-right">
                <div className="font-black">{formatVnd(order.total)}</div>
                <div className="text-xs text-white/35">{order.status}</div>
              </div>
              {order.status === 'completed' && (
                <Button variant="danger" onClick={() => void refund(order.orderId)}>Refund</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
