'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, ShoppingCart, ShieldCheck, Star, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Product } from '@/types/shop';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatVnd } from '@/lib/utils';
import { useCartStore } from '@/stores/cart';
import { toast } from 'sonner';

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter(); const add=useCartStore(s=>s.add); const [fav,setFav]=useState(false);
  const discount=product.originalPrice&&product.originalPrice>product.price?Math.round(100-product.price/product.originalPrice*100):product.discount??0;
  async function toggleFavorite(){try{const {firebaseAuth}=await import('@/lib/firebase/client');const token=await firebaseAuth.currentUser?.getIdToken();if(!token){router.push('/login');return;}const r=await fetch('/api/favorites',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({productId:product.id,active:!fav})});const j=await r.json();if(j.ok)setFav(!fav);}catch{toast.error('Không thể cập nhật yêu thích.')}}
  return <Container className="py-10"><Link href="/shop" className="mb-7 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"><ArrowLeft className="h-4 w-4"/>Shop</Link><div className="grid gap-7 lg:grid-cols-[1.05fr_.95fr]"><div className="lv-glass overflow-hidden rounded-3xl"><div className="relative aspect-[16/10]"><Image src={product.thumbnail} fill sizes="(max-width: 1024px) 100vw, 60vw" alt={product.name} className="object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"/></div>{product.images?.length ? <div className="grid grid-cols-4 gap-2 p-3">{product.images.slice(0,4).map((src,i)=><div key={src+i} className="relative aspect-video overflow-hidden rounded-xl border border-white/10"><Image src={src} fill alt="" className="object-cover"/></div>)}</div>:null}</div><div className="lv-glass rounded-3xl p-7"><div className="flex flex-wrap gap-2"><Badge>{product.category}</Badge>{product.featured&&<Badge className="text-purple-200">Nổi bật</Badge>}{discount>0&&<Badge className="text-pink-200">-{discount}%</Badge>}</div><h1 className="mt-5 text-4xl font-black tracking-tight">{product.name}</h1><p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/50">{product.description}</p><div className="mt-6 flex items-end justify-between"><div><div className="text-3xl font-black">{formatVnd(product.price)}</div>{product.originalPrice&&<div className="text-sm text-white/30 line-through">{formatVnd(product.originalPrice)}</div>}</div><div className="text-right text-xs text-white/40"><div className="text-green-300">{product.inventoryCount} còn</div><div>{product.soldCount} đã bán</div></div></div><div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto_auto]"><Button onClick={()=>{add(product.id);toast.success('Đã thêm vào giỏ hàng.')}}><ShoppingCart className="h-4 w-4"/>Thêm vào giỏ</Button><Button variant="secondary" onClick={()=>{add(product.id);router.push('/checkout')}}><Zap className="h-4 w-4"/>Mua ngay</Button><button onClick={toggleFavorite} className="grid min-h-11 place-items-center rounded-xl border border-white/10 bg-white/[.05] px-4"><Heart className={`h-4 w-4 ${fav?'fill-pink-400 text-pink-400':'text-white/50'}`}/></button></div><div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-black/20 p-4"><ShieldCheck className="h-5 w-5 text-green-300"/><div className="mt-2 text-xs font-bold">Thanh toán an toàn</div></div><div className="rounded-xl bg-black/20 p-4"><Zap className="h-5 w-5 text-cyan-300"/><div className="mt-2 text-xs font-bold">Giao nhanh</div></div><div className="rounded-xl bg-black/20 p-4"><Star className="h-5 w-5 text-orange-300"/><div className="mt-2 text-xs font-bold">Kho tự động</div></div></div></div></div></Container>
}
