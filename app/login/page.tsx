'use client';

import type { FormEvent } from 'react';

import Link from 'next/link';
import { Mail, LockKeyhole, Globe2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, loginWithGoogle, authErrorMessage } from '@/lib/firebase/auth-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Container';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); setLoading(true); try { await loginUser(email, password); toast.success('Đăng nhập thành công.'); router.push('/'); } catch (e) { toast.error(authErrorMessage(e)); } finally { setLoading(false); } }
  async function google() { setLoading(true); try { await loginWithGoogle(); toast.success('Đăng nhập Google thành công.'); router.push('/'); } catch (e) { toast.error(authErrorMessage(e)); } finally { setLoading(false); } }
  return <Container className="flex min-h-[calc(100vh-180px)] max-w-xl items-center justify-center py-12"><div className="lv-glass lv-glow w-full rounded-3xl p-7 sm:p-9"><div className="mb-7"><div className="text-xs font-black uppercase tracking-[.24em] text-cyan-300/70">Account gateway</div><h1 className="mt-2 text-3xl font-black">Đăng nhập</h1><p className="mt-2 text-sm text-white/40">Truy cập ví tiền, đơn hàng và kho đã mua.</p></div><form onSubmit={submit} className="space-y-4"><label className="block text-xs font-bold text-white/55">Email<div className="relative mt-2"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" /><Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" placeholder="you@example.com" /></div></label><label className="block text-xs font-bold text-white/55">Mật khẩu<div className="relative mt-2"><LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" /><Input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11" placeholder="••••••••" /></div></label><div className="flex justify-end"><Link href="/forgot-password" className="text-xs text-cyan-300 hover:text-cyan-200">Quên mật khẩu?</Link></div><Button type="submit" loading={loading} className="w-full">Đăng nhập</Button></form><div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[.2em] text-white/25"><span className="h-px flex-1 bg-white/10" />hoặc<span className="h-px flex-1 bg-white/10" /></div><Button type="button" variant="secondary" onClick={google} loading={loading} className="w-full"><Globe2 className="h-4 w-4" />Tiếp tục với Google</Button><p className="mt-6 text-center text-sm text-white/40">Chưa có tài khoản? <Link className="font-bold text-purple-300" href="/register">Đăng ký</Link></p></div></Container>;
}
