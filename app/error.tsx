'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-4">
      <div className="lv-glass lv-glow w-full rounded-3xl p-8 text-center">
        <div className="text-xs font-black uppercase tracking-[.2em] text-pink-300/70">System Recovery</div>
        <h1 className="mt-3 text-3xl font-black">Có lỗi xảy ra</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/45">
          Hệ thống đã chặn việc hiển thị thông tin lỗi nội bộ. Bạn có thể tải lại trang để thử lại.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 rounded-xl bg-white/[.07] px-5 py-3 text-sm font-bold transition hover:bg-white/[.11]"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
