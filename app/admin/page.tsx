'use client';

import { useEffect, useState } from 'react';
import { formatVnd } from '@/lib/utils';
import type { AdminStats } from '@/types/admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { firebaseAuth } = await import('@/lib/firebase/client');
        const token = firebaseAuth.currentUser ? await firebaseAuth.currentUser.getIdToken() : null;
        if (!token || cancelled) return;
        const response = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const json: { ok?: boolean; data?: AdminStats } = await response.json();
        if (!cancelled && json.ok) setStats(json.data ?? null);
      } catch {
        if (!cancelled) setStats(null);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const cards = [
    ['Users', stats?.users ?? '—'],
    ['Products', stats?.products ?? '—'],
    ['Orders', stats?.orders ?? '—'],
    ['Revenue', stats ? formatVnd(stats.revenue) : '—'],
    ['Pending deposits', stats?.pendingDeposits ?? '—'],
    ['Stock', stats?.stock ?? '—'],
  ] as const;

  return (
    <div>
      <div className="mb-7">
        <div className="text-xs font-black uppercase tracking-[.24em] text-cyan-300/70">Control center</div>
        <h1 className="mt-2 text-4xl font-black">Admin Dashboard</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="lv-glass rounded-2xl p-5">
            <div className="text-[10px] font-black uppercase tracking-[.2em] text-white/30">{label}</div>
            <div className="mt-3 text-2xl font-black">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 lv-glass rounded-2xl p-6">
        <div className="font-black">Operational notes</div>
        <ul className="mt-4 space-y-2 text-sm text-white/40">
          <li>Payment adapters chỉ settlement khi đã cấu hình theo tài liệu provider thật.</li>
          <li>Không có seed product tự động trong production.</li>
          <li>Admin authorization dùng Firebase custom claim `admin=true`.</li>
        </ul>
      </div>
    </div>
  );
}
