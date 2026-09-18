import { z } from 'zod';

export const registerSchema = z
  .object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/),
    email: z.email(),
    password: z.string().min(6).max(128),
    confirmPassword: z.string().min(6).max(128),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(128),
});

export const depositSchema = z.object({
  amount: z.number().int().min(1000).max(500000000),
});

export const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(20),
    }),
  ).min(1).max(20),
  voucherCode: z.string().trim().max(50).optional(),
});

export const productSchema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().max(10000),
  category: z.enum(['acc', 'file', 'service', 'software', 'other']),
  price: z.number().int().nonnegative(),
  originalPrice: z.number().int().nonnegative().optional(),
  thumbnail: z.string().url().refine((value) => value.startsWith('https://'), 'Thumbnail phải dùng HTTPS.'),
  images: z.array(z.string().url().refine((value) => value.startsWith('https://'), 'Ảnh phải dùng HTTPS.')).max(12).optional(),
  featured: z.boolean().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  badge: z.string().max(40).optional(),
  features: z.array(z.string().max(180)).max(20).optional(),
  inventoryCount: z.number().int().nonnegative().optional(),
  fileAsset: z.object({ storagePath: z.string().min(1), fileName: z.string().min(1), sizeBytes: z.number().int().nonnegative().optional() }).optional(),
});

export const voucherSchema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Z0-9_-]+$/),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  minOrder: z.number().int().nonnegative(),
  maxDiscount: z.number().int().nonnegative().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.number().int(),
  endsAt: z.number().int(),
  active: z.boolean(),
  category: z.string().optional(),
  productId: z.string().optional(),
});

export const cardDepositSchema = z.object({
  network: z.enum(['viettel', 'vinaphone', 'mobifone', 'vnmobi']),
  cardType: z.enum(['scratch', 'electronic']),
  denomination: z.number().int().positive(),
  serial: z.string().trim().min(5).max(25).regex(/^[A-Za-z0-9]+$/),
  pin: z.string().trim().min(5).max(15).regex(/^\d+$/),
});
