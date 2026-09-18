import type { Metadata } from 'next';
import { getAdminDb } from '@/lib/firebase/admin';
import type { Product } from '@/types/shop';
import { ProductDetailClient } from '@/components/shop/ProductDetailClient';
import { toPublicProduct } from '@/lib/db/public-product';

export const dynamic = 'force-dynamic';

async function getProduct(slug: string) {
  try {
  const snapshot = await getAdminDb().collection('products').where('slug','==',slug).where('status','==','active').limit(1).get();
  if (snapshot.empty) return null;
  return toPublicProduct({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Product & Record<string, unknown>);
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug:string }> }): Promise<Metadata> {
  const { slug }=await params; const product=await getProduct(slug); if(!product)return {title:'Không tìm thấy sản phẩm'};
  return {title:product.name,description:product.description.slice(0,160),openGraph:{title:product.name,description:product.description.slice(0,160),images:[product.thumbnail]}};
}

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const product=await getProduct(slug);if(!product)return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-white/40">Không tìm thấy sản phẩm.</div>;return <ProductDetailClient product={product}/>}
