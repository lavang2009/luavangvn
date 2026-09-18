'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { ProductCard } from '@/components/shop/ProductCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types/shop';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { fetchJson } from '@/lib/api';

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 12;

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('category');
    if (initial && ['acc', 'file'].includes(initial)) setCategory(initial);
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ limit: '100' });
    if (category !== 'all') q.set('category', category);
    fetchJson<{ ok: boolean; data?: { items: Product[] }; error?: { message?: string } }>(`/api/products?${q.toString()}`)
      .then(({ response, body }) => {
        if (response.ok && body?.ok) {
          setProducts(body.data?.items ?? []);
          return;
        }
        setProducts([]);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => setPage(1), [search, category, sort]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => !q || `${p.name} ${p.description}`.toLowerCase().includes(q));
  }, [products, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'popular' ? b.soldCount - a.soldCount : sort === 'stock' ? b.inventoryCount - a.inventoryCount : b.createdAt - a.createdAt), [filtered, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);

  return <Container className="py-12">
    <SectionTitle eyebrow="shop" title="Kho sản phẩm" desc="ACC + FILE được đọc từ Firestore. Giá và stock ở checkout luôn được xác minh lại phía server." />
    <div className="mb-7 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
      <div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="pl-11" /></div>
      <div className="flex gap-2"><Button variant={category==='all'?'primary':'secondary'} onClick={() => setCategory('all')}>Tất cả</Button><Button variant={category==='acc'?'primary':'secondary'} onClick={() => setCategory('acc')}>ACC</Button><Button variant={category==='file'?'primary':'secondary'} onClick={() => setCategory('file')}>FILE</Button></div>
      <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-white/35" /><select value={sort} onChange={(e) => setSort(e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-white/[.05] px-3 text-sm text-white outline-none"><option className="bg-[#111126]" value="newest">Mới nhất</option><option className="bg-[#111126]" value="popular">Phổ biến</option><option className="bg-[#111126]" value="price-asc">Giá tăng</option><option className="bg-[#111126]" value="price-desc">Giá giảm</option><option className="bg-[#111126]" value="stock">Tồn kho</option></select></div>
    </div>
    {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:6}).map((_,i)=><div key={i} className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[.03]" />)}</div> : visible.length ? <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      <div className="mt-7 flex items-center justify-center gap-2"><Button variant="secondary" disabled={page<=1} onClick={()=>setPage((v)=>Math.max(1,v-1))}>←</Button><span className="px-3 text-xs text-white/35">Trang {page} / {pageCount}</span><Button variant="secondary" disabled={page>=pageCount} onClick={()=>setPage((v)=>Math.min(pageCount,v+1))}>→</Button></div>
    </> : <div className="lv-glass rounded-2xl p-14 text-center"><div className="text-lg font-black">Không tìm thấy sản phẩm</div><p className="mt-2 text-sm text-white/40">Thử đổi từ khóa hoặc danh mục.</p></div>}
  </Container>;
}
