'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatDate, formatVnd } from '@/lib/utils';
import { toast } from 'sonner';
import type { AdminDepositRow } from '@/types/admin';

export default function AdminDeposits() {
  const [items, setItems] = useState<AdminDepositRow[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  async function token() {
    const { firebaseAuth } = await import('@/lib/firebase/client');
    return firebaseAuth.currentUser?.getIdToken();
  }

  async function load() {
    const t = await token();
    if (!t) return;
    const response = await fetch('/api/admin/deposits', { headers: { Authorization: `Bearer ${t}` } });
    if (!response.ok) return;
    const json: { ok?: boolean; data?: { items?: AdminDepositRow[] } } = await response.json();
    if (json.ok) setItems(json.data?.items ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(depositId: string, action: 'approve' | 'reject') {
    const t = await token();
    if (!t) return;
    const amount = action === 'approve' ? Number(amounts[depositId] || 0) : undefined;
    const response = await fetch('/api/admin/deposits', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositId, action, amount }),
    });
    const json: { ok?: boolean; error?: { message?: string } } = await response.json();
    json.ok
      ? toast.success(action === 'approve' ? 'Đã cộng ví.' : 'Đã từ chối.')
      : toast.error(json.error?.message ?? 'Thao tác thất bại.');
    void load();
  }

  return (
    <div>
      <h1 className="text-3xl font-black">Deposits</h1>
      <div className="mt-6 space-y-3">
        {items.map((d) => (
          <div key={d.depositId} className="lv-glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-black">{d.paymentCode ?? d.depositId}</div>
                <div className="mt-1 text-xs text-white/35">
                  {d.userId} • {d.provider} • {formatDate(d.createdAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-black">Yêu cầu: {formatVnd(d.requestedAmount)}</div>
                <div className="text-xs text-white/35">{d.status}</div>
              </div>
            </div>
            {['pending', 'processing'].includes(d.status) && (
              <div className="mt-4 flex gap-2">
                <Input
                  value={amounts[d.depositId] ?? String(d.requestedAmount)}
                  onChange={(e) =>
                    setAmounts({ ...amounts, [d.depositId]: e.target.value.replace(/\D/g, '') })
                  }
                  inputMode="numeric"
                />
                <Button onClick={() => void act(d.depositId, 'approve')}>Approve</Button>
                <Button variant="danger" onClick={() => void act(d.depositId, 'reject')}>
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
