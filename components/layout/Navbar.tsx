'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, FileBox, Gamepad2, Home, LogIn, Menu, Search, ShoppingCart, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { logout } from '@/lib/firebase/auth-client';
import { formatVnd } from '@/lib/utils';
import { useCartStore } from '@/stores/cart';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

const links = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/shop', label: 'Shop', icon: Search },
  { href: '/shop?category=acc', label: 'ACC', icon: Gamepad2 },
  { href: '/shop?category=file', label: 'FILE', icon: FileBox },
];

export function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const count = useCartStore((s) => s.items.reduce((a, b) => a + b.quantity, 0));
  const [profile, setProfile] = useState<{ username: string; balance: number; photoURL?: string; role?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && data?.ok) setProfile(data.data);
      } catch {
        if (!cancelled) setProfile(null);
      }
    };
    void loadProfile();
    return () => { cancelled = true; };
  }, [user]);

  return <>
    <header className="sticky top-0 z-50 border-b border-white/[.07] bg-[#070713]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${pathname === href ? 'bg-white/[.08] text-white' : 'text-white/55 hover:bg-white/[.05] hover:text-white'}`}><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span></Link>)}
          {user && <Link href="/deposit" className="rounded-xl px-3 py-2 text-sm font-semibold text-white/55 hover:bg-white/[.05] hover:text-white"><span className="flex items-center gap-2"><Wallet className="h-4 w-4" />Nạp tiền</span></Link>}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.05] text-white/70 transition hover:bg-white/[.09] hover:text-white" aria-label="Giỏ hàng"><ShoppingCart className="h-4 w-4" />{count > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-pink-500 px-1 text-center text-[10px] font-black leading-5 text-white">{count}</span>}</Link>
          {!loading && user ? <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-2 py-1.5 hover:bg-white/[.08]">
              <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 font-black">{profile?.photoURL ? <img src={profile.photoURL} alt="" className="h-full w-full object-cover" /> : (profile?.username?.[0] ?? 'U').toUpperCase()}</span>
              <span className="hidden text-left md:block"><span className="block text-xs font-bold">{profile?.username ?? user.email?.split('@')[0]}</span><span className="block text-[11px] text-cyan-300">{formatVnd(profile?.balance ?? 0)}</span></span><ChevronDown className="h-4 w-4 text-white/40" />
            </button>
            {profileOpen && <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-[#111126] p-2 shadow-2xl">
              <Link onClick={() => setProfileOpen(false)} href="/profile" className="block rounded-xl px-3 py-3 text-sm text-white/75 hover:bg-white/[.05]">Tài khoản</Link>
              <Link onClick={() => setProfileOpen(false)} href="/orders" className="block rounded-xl px-3 py-3 text-sm text-white/75 hover:bg-white/[.05]">Đơn hàng</Link>
              <Link onClick={() => setProfileOpen(false)} href="/deposit/history" className="block rounded-xl px-3 py-3 text-sm text-white/75 hover:bg-white/[.05]">Lịch sử nạp</Link>
              {profile?.role === 'admin' && <Link onClick={() => setProfileOpen(false)} href="/admin" className="block rounded-xl px-3 py-3 text-sm font-semibold text-purple-200 hover:bg-white/[.05]">Quản trị</Link>}<button onClick={async () => { await logout(); setProfileOpen(false); router.push('/'); }} className="w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-300 hover:bg-rose-500/10">Đăng xuất</button>
            </div>}
          </div> : <div className="hidden sm:block"><Link href="/login"><Button variant="secondary" className="min-h-10"> <LogIn className="h-4 w-4" />Đăng nhập</Button></Link></div>}
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.05] lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu"><Menu className="h-5 w-5" /></button>
        </div>
      </div>
      {menuOpen && <div className="border-t border-white/[.07] px-4 py-3 lg:hidden"><div className="mx-auto max-w-7xl space-y-1">{links.map(({ href, label }) => <Link key={href} onClick={() => setMenuOpen(false)} href={href} className="block rounded-xl px-3 py-3 text-sm font-semibold text-white/70 hover:bg-white/[.05]">{label}</Link>)}{user && <Link onClick={() => setMenuOpen(false)} href="/deposit" className="block rounded-xl px-3 py-3 text-sm font-semibold text-cyan-300">Nạp tiền</Link>}{!user && <Link onClick={() => setMenuOpen(false)} href="/login" className="block rounded-xl px-3 py-3 text-sm font-semibold text-white">Đăng nhập</Link>}</div></div>}
    </header>
  </>;
}
