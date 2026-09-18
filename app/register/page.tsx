'use client';

import type { FormEvent } from 'react';
import Link from 'next/link';
import { Globe2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser, loginWithGoogle, authErrorMessage } from '@/lib/firebase/auth-client';
import { ensureUserProfile } from '@/lib/firebase/user';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Container';
import { toast } from 'sonner';
import { registerSchema } from '@/lib/validation/schemas';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => {
    if (password.length < 6) return 'Yếu';
    if (password.length < 10) return 'Vừa';
    return /[A-Z]/.test(password) && /\d/.test(password) ? 'Tốt' : 'Khá';
  }, [password]);

  async function bootstrapProfile(createdUser: Awaited<ReturnType<typeof registerUser>>) {
    const token = await createdUser.getIdToken();
    const response = await fetch('/api/auth/bootstrap', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) {
      try {
        await ensureUserProfile({
          uid: createdUser.uid,
          email: createdUser.email,
          displayName: createdUser.displayName,
          photoURL: createdUser.photoURL,
          providerId: createdUser.providerData[0]?.providerId ?? 'password',
        });
      } catch {
        // The Firebase Auth account is already created; profile bootstrap will retry on auth state.
      }
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = registerSchema.safeParse({ username, email, password, confirmPassword: confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const createdUser = await registerUser(email, password, username);
      await bootstrapProfile(createdUser);
      toast.success('Tạo tài khoản thành công.');
      router.push('/');
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Đăng ký/đăng nhập Google thành công.');
      router.push('/');
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="flex min-h-[calc(100vh-180px)] max-w-xl items-center justify-center py-12">
      <div className="lv-glass w-full rounded-3xl p-7 sm:p-9">
        <div className="mb-7">
          <div className="text-xs font-black uppercase tracking-[.24em] text-purple-300/70">Create identity</div>
          <h1 className="mt-2 text-3xl font-black">Tạo tài khoản</h1>
          <p className="mt-2 text-sm text-white/40">Mật khẩu tối thiểu 6 ký tự. Password không được lưu vào Firestore.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs font-bold text-white/55">
            Username
            <div className="relative mt-2">
              <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
              <Input required value={username} onChange={(event) => setUsername(event.target.value)} className="pl-11" placeholder="lua_vang" />
            </div>
          </label>
          <label className="block text-xs font-bold text-white/55">
            Email
            <div className="relative mt-2">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
              <Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-11" placeholder="you@example.com" />
            </div>
          </label>
          <label className="block text-xs font-bold text-white/55">
            Mật khẩu
            <div className="relative mt-2">
              <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
              <Input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-11" placeholder="••••••••" />
            </div>
            <span className={`mt-1 block text-[11px] ${password.length < 6 ? 'text-rose-300' : 'text-green-300'}`}>Độ mạnh: {strength}</span>
          </label>
          <label className="block text-xs font-bold text-white/55">
            Xác nhận mật khẩu
            <div className="relative mt-2">
              <Input required minLength={6} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Nhập lại mật khẩu" />
            </div>
          </label>
          <Button type="submit" loading={loading} className="w-full">Tạo tài khoản</Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[.2em] text-white/25"><span className="h-px flex-1 bg-white/10" />hoặc<span className="h-px flex-1 bg-white/10" /></div>
        <Button type="button" variant="secondary" onClick={google} loading={loading} className="w-full"><Globe2 className="h-4 w-4" />Tiếp tục với Google</Button>
        <p className="mt-6 text-center text-sm text-white/40">Đã có tài khoản? <Link className="font-bold text-cyan-300" href="/login">Đăng nhập</Link></p>
      </div>
    </Container>
  );
}
