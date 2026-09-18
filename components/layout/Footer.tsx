import { GitBranch, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Container } from '@/components/ui/Container';

export function Footer() {
  return <footer className="mt-20 border-t border-white/[.07] bg-black/20"><Container className="grid gap-10 py-12 md:grid-cols-3"><div><Logo /><p className="mt-5 max-w-sm text-sm leading-7 text-white/40">Kho ACC + FILE DIGITAL được vận hành theo hướng tự động hóa, bảo mật và minh bạch trạng thái giao dịch.</p></div><div><div className="mb-4 text-xs font-black uppercase tracking-[.22em] text-white/60">Hệ thống</div><div className="space-y-3 text-sm text-white/45"><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-300" />Thanh toán xác thực server-side</p><p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-300" />Giao hàng tự động</p></div></div><div><div className="mb-4 text-xs font-black uppercase tracking-[.22em] text-white/60">Kết nối</div><p className="text-sm text-white/45">© Lù A Vang</p><div className="mt-4 flex gap-2"><a className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] hover:bg-white/[.08]" href="#" aria-label="GitHub"><GitBranch className="h-4 w-4" /></a></div></div></Container></footer>;
}
