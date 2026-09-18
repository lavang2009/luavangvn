import type { Product } from '@/types/shop';

export function toPublicProduct(input: Product & Record<string, unknown>): Product {
  const { fileAsset: _privateFileAsset, ...publicProduct } = input;
  return publicProduct as Product;
}
