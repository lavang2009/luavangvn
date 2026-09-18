'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import type { AdminInventoryProduct } from '@/types/admin';

export default function AdminInventory() {
  const [products, setProducts] = useState<AdminInventoryProduct[]>([]);
  const [productId, setProductId] = useState('');
  const [text, setText] = useState('');

  async function token(): Promise<string | null> {
    const { firebaseAuth } = await import('@/lib/firebase/client');
    return firebaseAuth.currentUser ? firebaseAuth.currentUser.getIdToken() : null;
  }

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      try {
        const t = await token();
        if (!t || cancelled) return;
        const response = await fetch('/api/admin/products', { headers: { Authorization: `Bearer ${t}` } });
        if (!response.ok) return;
        const json: { ok?: boolean; data?: { items?: AdminInventoryProduct[] } } = await response.json();
        if (!cancelled && json.ok) {
          setProducts((json.data?.items ?? []).filter((product) => product.category === 'acc'));
        }
      } catch {
        if (!cancelled) setProducts([]);
      }
    };
    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  async function importRows() {
    const rows = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [username, password, ...rest] = line.split('|');
        return { productId, username, password, note: rest.join('|') };
      });
    const t = await token();
    if (!t) return;
    const response = await fetch('/api/admin/inventory', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: rows }),
    });
    const json: { ok?: boolean; data?: { inserted?: number }; error?: { message?: string } } = await response.json();
    if (json.ok) {
      toast.success(`Đã import ${json.data?.inserted ?? 0} ACC.`);
      setText('');
    } else {
      toast.error(json.error?.message ?? 'Import thất bại.');
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-black">ACC Inventory</h1>
      <p className="mt-1 text-sm text-white/35">Bulk paste: username|password|note. Secret không render trong HTML public.</p>
      <div className="lv-glass mt-6 rounded-2xl p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-white/[.05] px-3">
            <option value="">Chọn sản phẩm ACC</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
          <Button onClick={() => void importRows()} disabled={!productId || !text.trim()}>Import</Button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-4 min-h-60 w-full rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-sm outline-none"
          placeholder={'user1|pass1|note\nuser2|pass2'}
        />
      </div>
    </div>
  );
}
