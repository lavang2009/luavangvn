'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatDate } from '@/lib/utils';
import type { NotificationRow } from '@/types/admin';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);

  async function load() {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    const json: { ok?: boolean; data?: { items?: NotificationRow[] } } = await response.json();
    if (json.ok) setItems(json.data?.items ?? []);
  }

  useEffect(() => { void load(); }, [user]);

  async function read(id: string) {
    const token = await user?.getIdToken();
    if (!token) return;
    await fetch('/api/notifications', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    void load();
  }

  async function readAll() {
    const token = await user?.getIdToken();
    if (!token) return;
    await fetch('/api/notifications', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'all' }) });
    void load();
  }

  if (loading) return <Container className="py-12">Loading...</Container>;
  if (!user) return <Container className="py-12 text-white/40">Đăng nhập để xem thông báo.</Container>;

  return <Container className="py-12"><div className="flex items-end justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[.24em] text-purple-300/70">Notification center</div><h1 className="mt-2 text-4xl font-black">Thông báo</h1></div><Button variant="secondary" onClick={() => void readAll()}><CheckCheck className="h-4 w-4" />Đánh dấu đã đọc</Button></div><div className="mt-6 space-y-3">{items.map((notification) => <button key={notification.id} onClick={() => void read(notification.id)} className={`lv-glass w-full rounded-2xl p-5 text-left ${!notification.read ? 'border-cyan-400/20' : ''}`}><div className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-500/10"><Bell className="h-4 w-4 text-purple-200" /></div><div><div className="font-black">{notification.title}</div><div className="mt-1 text-sm text-white/45">{notification.body}</div><div className="mt-2 text-xs text-white/25">{formatDate(Number(notification.createdAt))}</div></div></div></button>)}{!items.length && <div className="lv-glass rounded-2xl p-12 text-center text-white/35">Chưa có thông báo.</div>}</div></Container>;
}
