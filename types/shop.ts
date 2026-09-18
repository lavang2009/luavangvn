export type ProductCategory = 'acc' | 'file' | 'service' | 'software' | 'other';
export type ProductStatus = 'active' | 'inactive' | 'archived';
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled' | 'refunded';
export type DeliveryStatus = 'pending' | 'ready' | 'delivered' | 'failed';
export type DepositStatus = 'pending' | 'processing' | 'success' | 'expired' | 'failed' | 'rejected';
export type TransactionType = 'deposit' | 'purchase' | 'refund' | 'adjustment';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  discount?: number;
  thumbnail: string;
  images?: string[];
  inventoryCount: number;
  soldCount: number;
  viewCount: number;
  status: ProductStatus;
  featured: boolean;
  badge?: string;
  features?: string[];
  fileAsset?: { storagePath: string; fileName: string; sizeBytes?: number };
  createdAt: number;
  updatedAt: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  photoURL?: string;
  provider: string;
  role: 'user' | 'admin';
  balance: number;
  totalSpent: number;
  totalDeposited: number;
  totalOrders: number;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number;
  status: 'active' | 'blocked';
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  slug: string;
  category: ProductCategory;
  unitPrice: number;
  quantity: number;
  thumbnail: string;
}

export interface Order {
  orderId: string;
  userId: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'balance';
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  createdAt: number;
  completedAt?: number;
}

export interface Deposit {
  depositId: string;
  userId: string;
  amount: number;
  requestedAmount: number;
  method: 'sepay' | 'nappay_card' | 'manual';
  provider: string;
  transactionId?: string;
  status: DepositStatus;
  paymentCode: string;
  providerReference?: string;
  createdAt: number;
  updatedAt: number;
  processedAt?: number;
  failureReason?: string;
}
