'use client';

import type { FormEvent } from 'react';

import { Mail } from 'lucide-react';
import { useState } from 'react';
import { resetPassword, authErrorMessage } from '@/lib/firebase/auth-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Container';
import { toast } from 'sonner';

export default function ForgotPasswordPage(){const [email,setEmail]=useState('');const [loading,setLoading]=useState(false);async function submit(e:FormEvent){e.preventDefault();setLoading(true);try{await resetPassword(email);toast.success('Email khôi phục đã được gửi nếu tài khoản tồn tại.');}catch(e){toast.error(authErrorMessage(e));}finally{setLoading(false)}}return <Container className="flex min-h-[calc(100vh-180px)] max-w-xl items-center justify-center py-12"><div className="lv-glass w-full rounded-3xl p-7"><div className="text-xs font-black uppercase tracking-[.24em] text-cyan-300/70">Recovery</div><h1 className="mt-2 text-3xl font-black">Khôi phục mật khẩu</h1><p className="mt-2 text-sm text-white/40">Firebase Authentication sẽ xử lý reset password.</p><form onSubmit={submit} className="mt-7 space-y-4"><div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25"/><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="pl-11" placeholder="you@example.com"/></div><Button loading={loading} type="submit" className="w-full">Gửi email khôi phục</Button></form></div></Container>}
