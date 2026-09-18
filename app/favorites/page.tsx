'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { ProductCard } from '@/components/shop/ProductCard';
import type { Product } from '@/types/shop';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import type { FavoriteRef } from '@/types/admin';

interface ProductResponse { ok?: boolean; data?: Product; }

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const json: { ok?: boolean; data?: { items?: FavoriteRef[] } } = await response.json();
        if (!json.ok) return;
        const rows = await Promise.all((json.data?.items ?? []).map(async (favorite) => {
          const itemResponse = await fetch(`/api/products/by-id/${favorite.productId}`);
          return itemResponse.json() as Promise<ProductResponse>;
        }));
        if (!cancelled) setProducts(rows.filter((row) => row.ok && row.data).map((row) => row.data as Product));
      } catch {
        if (!cancelled) setProducts([]);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <Container className="py-12">Loading...</Container>;
  if (!user) return <Container className="py-12"><Link href="/login" className="text-cyan-300">Đăng nhập để xem yêu thích.</Link></Container>;

  return <Container className="py-12"><div className="mb-8"><div className="text-xs font-black uppercase tracking-[.24em] text-pink-300/70">Favorites</div><h1 className="mt-2 text-4xl font-black">Yêu thích</h1></div>{products.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="lv-glass rounded-2xl p-12 text-center text-white/35">Chưa có sản phẩm yêu thích.</div>}</Container>;
}
