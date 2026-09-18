import type { Deposit, OrderStatus, Product, ProductCategory, UserProfile } from './shop';

export interface AdminDepositRow extends Deposit {
  provider: string;
}

export interface AdminInventoryProduct {
  id: string;
  name: string;
  category: ProductCategory;
}

export interface AdminOrderRow {
  orderId: string;
  userId: string;
  total: number;
  status: OrderStatus;
  createdAt: number;
}

export interface AdminStats {
  users: number;
  products: number;
  orders: number;
  revenue: number;
  pendingDeposits: number;
  stock: number;
}

export interface AdminProductRow extends Product {
  inventoryCount: number;
  soldCount: number;
}

export interface AdminProductForm {
  name: string;
  description: string;
  category: 'acc' | 'file';
  price: string;
  originalPrice: string;
  thumbnail: string;
  features: string;
}

export type AdminUserRow = Pick<UserProfile, 'uid' | 'username' | 'email' | 'balance' | 'role' | 'status'>;

export interface AdminVoucherRow {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  usageCount?: number;
  usageLimit?: number;
  active: boolean;
}

export interface DepositHistoryRow extends Deposit {
  provider: string;
}

export interface FavoriteRef {
  productId: string;
}

export interface NotificationRow {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
}

export interface DownloadLink {
  deliveryId: string;
  fileName: string;
  url: string;
}

export interface OrderDelivery {
  id: string;
  productId: string;
  category: ProductCategory;
  username?: string;
  credential?: string;
  password?: string;
  note?: string;
  fileName?: string;
  url?: string;
}

export interface OrderDetailData {
  order: {
    id: string;
    subtotal: number;
    discount: number;
    total: number;
    status: OrderStatus;
    createdAt: number;
    items: Array<{
      productId: string;
      name: string;
      category: ProductCategory;
      quantity: number;
    }>;
  };
  deliveries: OrderDelivery[];
}

export interface DepositCreateResponse {
  paymentCode: string;
  qrDataUrl: string | null;
  bankInfo: {
    bank?: string;
    account?: string;
    accountName: string;
  };
  expiresAt: number;
  depositId: string;
}
