import { requireAuth } from '@/lib/security/auth';
import { orderSchema } from '@/lib/validation/schemas';
import { createBalanceOrder } from '@/lib/db/commerce';
import { fail, ok } from '@/lib/api';
import { rateLimit } from '@/lib/security/rate-limit';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const rl = rateLimit(`order:${auth.uid}`, 8, 60000);
    if (!rl.ok) return fail('Bạn thao tác quá nhanh. Hãy thử lại sau.', 429, 'RATE_LIMITED');
    const parsed = orderSchema.safeParse(await request.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Giỏ hàng không hợp lệ.');
    const result = await createBalanceOrder(auth.uid, parsed.data.items, parsed.data.voucherCode);
    return ok(result, 201);
  } catch (error) {
    const key = error instanceof Error ? error.message : '';
    const map: Record<string, [string, number, string]> = {
      UNAUTHORIZED: ['Bạn cần đăng nhập.', 401, 'UNAUTHORIZED'],
      PROFILE_NOT_FOUND: ['Tài khoản chưa được khởi tạo.', 400, 'PROFILE_NOT_FOUND'],
      ACCOUNT_BLOCKED: ['Tài khoản đang bị khóa.', 403, 'ACCOUNT_BLOCKED'],
      PRODUCT_NOT_FOUND: ['Sản phẩm không tồn tại.', 404, 'PRODUCT_NOT_FOUND'],
      PRODUCT_UNAVAILABLE: ['Sản phẩm đang tạm ngưng.', 409, 'PRODUCT_UNAVAILABLE'],
      OUT_OF_STOCK: ['Một sản phẩm vừa hết hàng. Hãy tải lại giỏ hàng.', 409, 'OUT_OF_STOCK'],
      INSUFFICIENT_BALANCE: ['Số dư ví không đủ.', 409, 'INSUFFICIENT_BALANCE'],
      VOUCHER_INVALID: ['Voucher không hợp lệ.', 400, 'VOUCHER_INVALID'],
      VOUCHER_EXPIRED: ['Voucher đã hết hạn hoặc đang tắt.', 400, 'VOUCHER_EXPIRED'],
      VOUCHER_MIN_ORDER: ['Đơn hàng chưa đạt giá trị tối thiểu.', 400, 'VOUCHER_MIN_ORDER'],
      VOUCHER_LIMIT: ['Voucher đã hết lượt sử dụng.', 400, 'VOUCHER_LIMIT'],
      VOUCHER_USER_LIMIT: ['Bạn đã dùng voucher này đủ số lần.', 400, 'VOUCHER_USER_LIMIT'],
      VOUCHER_CATEGORY: ['Voucher không áp dụng cho danh mục này.', 400, 'VOUCHER_CATEGORY'],
      VOUCHER_PRODUCT: ['Voucher không áp dụng cho sản phẩm này.', 400, 'VOUCHER_PRODUCT'],
      FILE_NOT_CONFIGURED: ['FILE chưa có asset giao hàng.', 409, 'FILE_NOT_CONFIGURED'],
      UNSUPPORTED_PRODUCT: ['Loại sản phẩm này chưa được checkout.', 400, 'UNSUPPORTED_PRODUCT'],
    };
    const response = map[key];
    return response ? fail(response[0], response[1], response[2]) : fail('Không thể hoàn tất đơn hàng.', 500, 'ORDER_FAILED');
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    const snapshot = await getAdminDb().collection('orders').where('userId', '==', auth.uid).orderBy('createdAt', 'desc').limit(50).get();
    return ok({ items: snapshot.docs.map((d) => d.data()) });
  } catch {
    return fail('Không thể tải đơn hàng.', 500, 'ORDERS_FAILED');
  }
}

