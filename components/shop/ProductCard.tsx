'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ShoppingCart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '@/types/shop';
import { formatVnd } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useCartStore } from '@/stores/cart';
import { toast } from 'sonner';

export function ProductCard({ product }: { product: Product }) {
  const add = useCartStore((s) => s.add);
  const discount = product.originalPrice && product.originalPrice > product.price ? Math.round(100 - (product.price / product.originalPrice) * 100) : product.discount ?? 0;
  return <motion.article initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -5 }} className="lv-glass group overflow-hidden rounded-2xl">
    <Link href={`/product/${product.slug}`} className="block">
      <div className="relative aspect-[16/10] overflow-hidden bg-black/20">
        <Image src={product.thumbnail} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2"><Badge>{product.category}</Badge>{product.featured && <Badge className="border-purple-400/20 bg-purple-500/20 text-purple-100">Nổi bật</Badge>}</div>
        {discount > 0 && <div className="absolute right-3 top-3 rounded-full bg-pink-500 px-2.5 py-1 text-[10px] font-black">-{discount}%</div>}
      </div>
      <div className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-cyan-200">{product.name}</h3><ArrowUpRight className="h-4 w-4 shrink-0 text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-300" /></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-white/40">{product.description}</p><div className="mt-4 flex items-end justify-between gap-3"><div><div className="text-lg font-black">{formatVnd(product.price)}</div>{product.originalPrice && product.originalPrice > product.price && <div className="text-xs text-white/30 line-through">{formatVnd(product.originalPrice)}</div>}</div><div className="text-right text-[11px] text-white/40"><div className="text-green-300">{product.inventoryCount} còn</div><div>{product.soldCount} đã bán</div></div></div></div>
    </Link>
    <div className="flex gap-2 px-4 pb-4"><button onClick={() => { add(product.id, 1); toast.success('Đã thêm vào giỏ hàng.'); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.05] py-2.5 text-xs font-bold transition hover:bg-white/[.1]"><ShoppingCart className="h-4 w-4" />Thêm giỏ</button><Link href={`/product/${product.slug}`} className="grid w-11 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400"><Zap className="h-4 w-4" /></Link></div>
  </motion.article>;
}
