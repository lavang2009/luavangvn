import { fail } from '@/lib/api';

export function adminError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  if (code === 'UNAUTHORIZED') return fail('Bạn cần đăng nhập.', 401, 'UNAUTHORIZED');
  if (code === 'FORBIDDEN') return fail('Bạn không có quyền quản trị.', 403, 'FORBIDDEN');
  return fail('Không thể hoàn tất thao tác quản trị.', 500, 'ADMIN_ERROR');
}
