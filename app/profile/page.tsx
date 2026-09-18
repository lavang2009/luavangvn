'use client';

import Link from 'next/link';
import { Bell, Heart, LogOut, Package, Wallet, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatVnd } from '@/lib/utils';
import { logout } from '@/lib/firebase/auth-client';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types/shop';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const json: { ok?: boolean; data?: UserProfile } = await response.json();
        if (!cancelled && json.ok) setData(json.data ?? null);
      } catch {
        if (!cancelled) setData(null);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <Container className="py-12">Loading...</Container>;
  if (!user) return <Container className="py-12"><Link href="/login" className="text-cyan-300">Đăng nhập để xem hồ sơ.</Link></Container>;

  return <Container className="py-12"><div className="lv-glass rounded-3xl p-7"><div className="flex flex-wrap items-center gap-5"><div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 text-2xl font-black">{data?.photoURL ? <img src={data.photoURL} alt="" className="h-full w-full object-cover" /> : (data?.username?.[0] ?? 'U').toUpperCase()}</div><div className="flex-1"><h1 className="text-3xl font-black">{data?.displayName}</h1><div className="mt-1 text-sm text-white/40">@{data?.username} • {data?.email}</div></div>{data?.role === 'admin' && <Link href="/admin"><Button variant="secondary">Admin</Button></Link>}<Button variant="ghost" onClick={async () => { await logout(); router.push('/'); }}><LogOut className="h-4 w-4" />Đăng xuất</Button></div><div className="mt-8 grid gap-3 md:grid-cols-4"><div className="rounded-2xl bg-gradient-to-br from-purple-500/15 to-transparent p-5"><Wallet className="h-5 w-5 text-cyan-300" /><div className="mt-3 text-2xl font-black">{formatVnd(Number(data?.balance ?? 0))}</div><div className="mt-1 text-xs text-white/35">Số dư</div></div><div className="rounded-2xl bg-black/20 p-5"><div className="text-2xl font-black">{formatVnd(Number(data?.totalSpent ?? 0))}</div><div className="mt-1 text-xs text-white/35">Đã chi</div></div><div className="rounded-2xl bg-black/20 p-5"><div className="text-2xl font-black">{data?.totalOrders ?? 0}</div><div className="mt-1 text-xs text-white/35">Đơn hàng</div></div><div className="rounded-2xl bg-black/20 p-5"><div className="text-2xl font-black">{formatVnd(Number(data?.totalDeposited ?? 0))}</div><div className="mt-1 text-xs text-white/35">Đã nạp</div></div></div><div className="mt-6 grid gap-3 sm:grid-cols-5"><Link href="/orders" className="rounded-xl border border-white/10 bg-white/[.04] p-4 text-sm hover:bg-white/[.08]"><Package className="h-4 w-4 text-cyan-300" /><div className="mt-3 font-bold">Orders</div></Link><Link href="/deposit/history" className="rounded-xl border border-white/10 bg-white/[.04] p-4 text-sm hover:bg-white/[.08]"><Wallet className="h-4 w-4 text-green-300" /><div className="mt-3 font-bold">Deposits</div></Link><Link href="/favorites" className="rounded-xl border border-white/10 bg-white/[.04] p-4 text-sm hover:bg-white/[.08]"><Heart className="h-4 w-4 text-pink-300" /><div className="mt-3 font-bold">Favorites</div></Link><Link href="/notifications" className="rounded-xl border border-white/10 bg-white/[.04] p-4 text-sm hover:bg-white/[.08]"><Bell className="h-4 w-4 text-purple-300" /><div className="mt-3 font-bold">Notifications</div></Link><Link href="/settings" className="rounded-xl border border-white/10 bg-white/[.04] p-4 text-sm hover:bg-white/[.08]"><Settings className="h-4 w-4 text-orange-300" /><div className="mt-3 font-bold">Settings</div></Link></div></div></Container>;
}
