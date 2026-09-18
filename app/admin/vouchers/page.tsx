'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import type { AdminVoucherRow } from '@/types/admin';

type VoucherForm = {
  code: string;
  type: 'percent' | 'fixed';
  value: string;
  minOrder: string;
  maxDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  startsAt: string;
  endsAt: string;
};

export default function AdminVouchers() {
  const [items, setItems] = useState<AdminVoucherRow[]>([]);
  const [form, setForm] = useState<VoucherForm>({ code: '', type: 'percent', value: '10', minOrder: '0', maxDiscount: '', usageLimit: '100', perUserLimit: '1', startsAt: '', endsAt: '' });

  async function token() {
    const { firebaseAuth } = await import('@/lib/firebase/client');
    return firebaseAuth.currentUser?.getIdToken();
  }

  async function load() {
    const t = await token();
    if (!t) return;
    const response = await fetch('/api/admin/vouchers', { headers: { Authorization: `Bearer ${t}` } });
    if (!response.ok) return;
    const json: { ok?: boolean; data?: { items?: AdminVoucherRow[] } } = await response.json();
    if (json.ok) setItems(json.data?.items ?? []);
  }

  useEffect(() => { void load(); }, []);

  async function submit() {
    const t = await token();
    if (!t) return;
    const body = {
      code: form.code.toUpperCase(), type: form.type, value: Number(form.value), minOrder: Number(form.minOrder),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : 1,
      startsAt: form.startsAt ? new Date(form.startsAt).getTime() : Date.now(),
      endsAt: form.endsAt ? new Date(form.endsAt).getTime() : Date.now() + 30 * 864e5,
      active: true,
    };
    const response = await fetch('/api/admin/vouchers', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json: { ok?: boolean; error?: { message?: string } } = await response.json();
    json.ok ? (toast.success('Đã tạo voucher.'), void load()) : toast.error(json.error?.message ?? 'Không thể tạo voucher.');
  }

  const numericFields = [['value', 'Giá trị'], ['minOrder', 'Min order'], ['maxDiscount', 'Max discount'], ['usageLimit', 'Usage limit'], ['perUserLimit', 'Per-user']] as const;

  return (
    <div>
      <h1 className="text-3xl font-black">Vouchers</h1>
      <div className="lv-glass mt-6 grid gap-3 rounded-2xl p-5 md:grid-cols-2">
        <Input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as VoucherForm['type'] })} className="rounded-xl border border-white/10 bg-white/[.05] px-3"><option value="percent">Percent</option><option value="fixed">Fixed</option></select>
        {numericFields.map(([key, label]) => <Input key={key} type="number" placeholder={label} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
        <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
        <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
        <Button className="md:col-span-2" onClick={() => void submit()}>Tạo voucher</Button>
      </div>
      <div className="mt-6 space-y-3">{items.map((voucher) => <div key={voucher.code} className="lv-glass flex items-center justify-between rounded-2xl p-5"><div><div className="font-black">{voucher.code}</div><div className="mt-1 text-xs text-white/35">{voucher.type} {voucher.value} • used {voucher.usageCount ?? 0}/{voucher.usageLimit ?? '∞'}</div></div><Badge>{voucher.active ? 'active' : 'inactive'}</Badge></div>)}</div>
    </div>
  );
}
