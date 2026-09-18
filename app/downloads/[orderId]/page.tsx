'use client';

import { Download, FileArchive } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import type { DownloadLink } from '@/types/admin';

export default function DownloadsPage() {
  const { user } = useAuth();
  const { orderId } = useParams<{ orderId: string }>();
  const [files, setFiles] = useState<DownloadLink[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/downloads/${orderId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const json: { ok?: boolean; data?: { urls?: DownloadLink[] }; error?: { message?: string } } = await response.json();
      if (json.ok) setFiles(json.data?.urls ?? []);
      else toast.error(json.error?.message ?? 'Không thể cấp link.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [user, orderId]);

  return <Container className="max-w-2xl py-12"><div className="lv-glass rounded-3xl p-7"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10"><FileArchive className="h-6 w-6 text-cyan-200" /></div><h1 className="mt-5 text-3xl font-black">Private downloads</h1><p className="mt-2 text-sm text-white/40">Link tải được cấp server-side và hết hạn ngắn hạn.</p><div className="mt-6 space-y-3">{files.map((file) => <div key={file.deliveryId} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 p-4"><span className="truncate text-sm font-semibold">{file.fileName}</span><Button variant="secondary" onClick={() => { const a = document.createElement('a'); a.href = file.url; a.target = '_blank'; a.download = file.fileName; a.click(); }}><Download className="h-4 w-4" />Tải</Button></div>)}{!files.length && <Button loading={loading} onClick={() => void load()} className="w-full">Cấp link tải</Button>}</div></div></Container>;
}
