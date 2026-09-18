'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatVnd } from '@/lib/utils';
import type { AdminProductForm, AdminProductRow } from '@/types/admin';

const blank: AdminProductForm = {
  name: '', description: '', category: 'acc', price: '10000', originalPrice: '', thumbnail: '', features: '',
};

export default function AdminProducts() {
  const [items, setItems] = useState<AdminProductRow[]>([]);
  const [form, setForm] = useState<AdminProductForm>(blank);
  const [editing, setEditing] = useState<string | null>(null);

  async function token() {
    const { firebaseAuth } = await import('@/lib/firebase/client');
    return firebaseAuth.currentUser?.getIdToken();
  }

  async function load() {
    const t = await token();
    if (!t) return;
    const response = await fetch('/api/admin/products', { headers: { Authorization: `Bearer ${t}` } });
    if (!response.ok) return;
    const json: { ok?: boolean; data?: { items?: AdminProductRow[] } } = await response.json();
    if (json.ok) setItems(json.data?.items ?? []);
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const t = await token();
    if (!t) return;
    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      thumbnail: form.thumbnail,
      features: form.features.split('\n').filter(Boolean),
      status: 'active' as const,
      featured: false,
    };
    await fetch('/api/admin/products', {
      method: editing ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { id: editing, data: body } : body),
    });
    setForm(blank);
    setEditing(null);
    void load();
  }

  async function archive(id: string) {
    const t = await token();
    if (!t) return;
    await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
    void load();
  }

  return (
    <div>
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-black">Products</h1><p className="mt-1 text-sm text-white/35">Không seed sản phẩm mặc định.</p></div></div>
      <form onSubmit={submit} className="lv-glass my-6 grid gap-3 rounded-2xl p-5 md:grid-cols-2">
        <Input required placeholder="Tên sản phẩm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as AdminProductForm['category'] })} className="rounded-xl border border-white/10 bg-white/[.05] px-3"><option value="acc">ACC</option><option value="file">FILE</option></select>
        <Input required type="number" min="0" placeholder="Giá" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <Input type="number" min="0" placeholder="Giá gốc" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} />
        <Input required placeholder="Thumbnail HTTPS" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
        <textarea required className="min-h-28 rounded-xl border border-white/10 bg-black/20 p-3 text-sm outline-none" placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <textarea className="min-h-24 rounded-xl border border-white/10 bg-black/20 p-3 text-sm outline-none" placeholder="Features, mỗi dòng một mục" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
        <Button type="submit">{editing ? 'Lưu sản phẩm' : 'Thêm sản phẩm'}</Button>
        {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(blank); }}>Hủy sửa</Button>}
      </form>
      <div className="space-y-3">
        {items.map((product) => (
          <div key={product.id} className="lv-glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><div className="font-black">{product.name}</div><div className="mt-1 text-xs text-white/30">{product.category} • {product.inventoryCount} stock • {product.soldCount} sold</div></div>
              <div className="text-right"><div className="font-black">{formatVnd(product.price)}</div><Badge>{product.status}</Badge></div>
              <div className="flex gap-2"><Button variant="secondary" onClick={() => { setEditing(product.id); setForm({ name: product.name, description: product.description, category: product.category === 'file' ? 'file' : 'acc', price: String(product.price), originalPrice: product.originalPrice ? String(product.originalPrice) : '', thumbnail: product.thumbnail, features: (product.features ?? []).join('\n') }); }}>Sửa</Button><Button variant="danger" onClick={() => void archive(product.id)}>Ẩn</Button></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
