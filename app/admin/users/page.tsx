'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatVnd } from '@/lib/utils';
import type { AdminUserRow } from '@/types/admin';

export default function AdminUsers() {
  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [q, setQ] = useState('');

  async function load() {
    const { firebaseAuth } = await import('@/lib/firebase/client');
    const token = await firebaseAuth.currentUser?.getIdToken();
    if (!token) return;
    const response = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    const json: { ok?: boolean; data?: { items?: AdminUserRow[] } } = await response.json();
    if (json.ok) setItems(json.data?.items ?? []);
  }

  useEffect(() => { void load(); }, []);

  async function patch(uid: string, data: Partial<Pick<AdminUserRow, 'role' | 'status'>>) {
    const { firebaseAuth } = await import('@/lib/firebase/client');
    const token = await firebaseAuth.currentUser?.getIdToken();
    if (!token) return;
    await fetch('/api/admin/users', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ uid, ...data }) });
    void load();
  }

  return (
    <div>
      <h1 className="text-3xl font-black">Users</h1>
      <div className="my-5 flex gap-2"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm username/email" /><Button onClick={() => void load()}>Tìm</Button></div>
      <div className="overflow-x-auto rounded-2xl border border-white/10"><table className="min-w-full text-sm"><thead className="bg-white/[.04] text-left text-white/35"><tr><th className="p-4">User</th><th className="p-4">Balance</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{items.map((user) => <tr key={user.uid} className="border-t border-white/5"><td className="p-4"><b>{user.username}</b><div className="text-xs text-white/30">{user.email}</div></td><td className="p-4">{formatVnd(Number(user.balance ?? 0))}</td><td className="p-4"><Badge>{user.role}</Badge></td><td className="p-4"><Badge>{user.status}</Badge></td><td className="flex gap-2 p-4">{user.status === 'active' ? <Button variant="danger" onClick={() => void patch(user.uid, { status: 'blocked' })}>Khóa</Button> : <Button variant="secondary" onClick={() => void patch(user.uid, { status: 'active' })}>Mở</Button>}{user.role === 'admin' ? <Button variant="ghost" onClick={() => void patch(user.uid, { role: 'user' })}>Bỏ admin</Button> : <Button variant="ghost" onClick={() => void patch(user.uid, { role: 'admin' })}>Set admin</Button>}</td></tr>)}</tbody></table></div>
    </div>
  );
}
