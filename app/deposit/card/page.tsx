'use client';

import type { FormEvent } from 'react';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatVnd } from '@/lib/utils';
import { toast } from 'sonner';

const AMOUNTS = [10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000, 1000000];

type CardResult = {
  requestId: string;
  status: number;
  statusLabel: string;
  message?: string;
  declaredAmount: number;
  value: number;
  receiveAmount: number;
  credited: boolean;
  creditedAmount: number;
  wrongValue: boolean;
  providerUnknown: boolean;
};

function providerText(result: CardResult) {
  if (result.wrongValue || result.status === 2) {
    return `SAI MỆNH GIÁ — Bạn chọn ${formatVnd(result.declaredAmount)} nhưng NAPPAY xác nhận ${formatVnd(result.value)}. Thẻ đã được nhà cung cấp xử lý và shop không cộng tiền. Vui lòng kiểm tra thật kỹ mệnh giá trước khi gửi thẻ.`;
  }
  if (result.status === 1 || result.credited) return `Nạp thành công ${formatVnd(result.creditedAmount || result.declaredAmount)}.`;
  if (result.status === 99 || result.providerUnknown) return 'NAPPAY chưa trả kết quả cuối. Hệ thống đã giữ giao dịch; bạn có thể kiểm tra lại bằng mã giao dịch.';
  if (result.status === 3) return 'Thẻ không hợp lệ hoặc đã được sử dụng.';
  if (result.status === 4) return 'NAPPAY đang bảo trì. Giao dịch chưa được xác nhận.';
  return result.message || 'NAPPAY chưa xác nhận giao dịch.';
}

export default function CardDepositPage() {
  const { user } = useAuth();
  const [network, setNetwork] = useState('viettel');
  const [denomination, setDenomination] = useState('10000');
  const [serial, setSerial] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CardResult | null>(null);

  useEffect(() => {
    if (!result?.requestId || !user || ![99].includes(result.status) || result.credited) return;

    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      if (cancelled || attempts >= 12) return;
      attempts += 1;
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/payments/nappay/card/check', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: result.requestId }),
        });
        const json = await response.json();
        if (!cancelled && json.ok) {
          setResult((current) => ({
            ...(current || result),
            status: Number(json.data.status),
            statusLabel: String(json.data.statusLabel || ''),
            message: json.data.message,
            value: Number(json.data.value || 0),
            receiveAmount: Number(json.data.amount || 0),
            credited: Boolean(json.data.credited),
            creditedAmount: Number(json.data.creditedAmount || 0),
            wrongValue: Boolean(json.data.wrongValue),
            providerUnknown: false,
          }));
          if (Number(json.data.status) !== 99 && !json.data.providerUnknown) return;
        }
      } catch {
        // Keep polling silently; the original transaction remains protected server-side.
      }
      if (!cancelled) window.setTimeout(poll, 5000);
    };

    const timer = window.setTimeout(poll, 5000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [result?.requestId, result?.status, result?.credited, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      toast.error('Bạn cần đăng nhập.');
      return;
    }

    const amount = Number(denomination);
    if (!Number.isInteger(amount) || !AMOUNTS.includes(amount)) {
      toast.error('Vui lòng chọn đúng mệnh giá được hỗ trợ.');
      return;
    }
    if (!serial || !pin) {
      toast.error('Vui lòng nhập đầy đủ serial và mã thẻ.');
      return;
    }

    const confirmed = window.confirm(
      `Bạn đã chọn mệnh giá ${formatVnd(amount)}. Nếu nhập sai mệnh giá, thẻ có thể đã được NAPPAY xử lý và shop không thể cộng lại số tiền. Bạn đã kiểm tra chính xác chưa?`,
    );
    if (!confirmed) return;

    setLoading(true);
    setResult(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/payments/nappay/card', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          network,
          cardType: 'scratch',
          denomination: amount,
          serial,
          pin,
        }),
      });

      const json = await response.json();
      if (!json.ok) {
        toast.error(json.error?.message ?? 'Không thể xử lý thẻ.');
        return;
      }

      const data = json.data as CardResult;
      setResult(data);
      if (data.credited) toast.success(providerText(data));
      else if (data.wrongValue) toast.error(providerText(data));
      else toast.message(providerText(data));
    } catch {
      toast.error('Không thể kết nối tới hệ thống nạp thẻ.');
    } finally {
      setLoading(false);
    }
  }

  async function checkNow() {
    if (!user || !result?.requestId) return;
    setChecking(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/payments/nappay/card/check', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: result.requestId }),
      });
      const json = await response.json();
      if (!json.ok) {
        toast.error(json.error?.message ?? 'Không thể kiểm tra giao dịch.');
        return;
      }
      const data = json.data;
      setResult((current) => ({
        ...(current || result),
        status: Number(data.status),
        statusLabel: String(data.statusLabel || ''),
        message: data.message,
        value: Number(data.value || 0),
        receiveAmount: Number(data.amount || 0),
        credited: Boolean(data.credited),
        creditedAmount: Number(data.creditedAmount || 0),
        wrongValue: Boolean(data.wrongValue),
        providerUnknown: false,
      }));
      toast.message(providerText({ ...(result || data), ...data } as CardResult));
    } catch {
      toast.error('Không thể kiểm tra giao dịch.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <Container className="max-w-2xl py-12">
      <div className="lv-glass rounded-3xl p-7">
        <div className="text-xs font-black uppercase tracking-[.24em] text-pink-300/70">NAPPAY</div>
        <h1 className="mt-2 text-4xl font-black">Nạp thẻ cào</h1>
        <p className="mt-2 text-sm leading-6 text-white/40">
          Thẻ được gửi từ trình duyệt qua HTTPS tới server. PIN/serial không được trả về cho client sau khi gửi.
        </p>

        <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/[.05] p-4 text-sm leading-6 text-rose-100/80">
          <b className="text-rose-100">CẢNH BÁO MỆNH GIÁ:</b> Bạn chọn sai mệnh giá thì NAPPAY có thể đã xử lý thẻ. Shop chỉ cộng đúng mệnh giá bạn đã khai báo khi NAPPAY xác nhận chính xác.
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-xs font-bold text-white/55">
            Nhà mạng
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-white/[.05] px-3 text-sm"
            >
              <option value="viettel">Viettel</option>
              <option value="vinaphone">Vinaphone</option>
              <option value="mobifone">Mobifone</option>
              <option value="vnmobi">VNMobi</option>
            </select>
          </label>

          <label className="block text-xs font-bold text-white/55">
            Mệnh giá
            <select
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-white/[.05] px-3 text-sm"
            >
              {AMOUNTS.map((value) => (
                <option key={value} value={value}>
                  {formatVnd(value)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold text-white/55">
            Serial
            <Input
              value={serial}
              onChange={(e) => setSerial(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
              placeholder="Nhập serial"
              autoComplete="off"
            />
          </label>

          <label className="block text-xs font-bold text-white/55">
            Mã thẻ
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Nhập mã thẻ"
              inputMode="numeric"
              autoComplete="off"
            />
          </label>

          <Button loading={loading} type="submit" className="w-full">
            Gửi thẻ tới NAPPAY
          </Button>
        </form>

        {result && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-white/35">Mã giao dịch</div>
                <div className="mt-1 font-mono text-sm font-black text-cyan-200">{result.requestId}</div>
              </div>
              <div className="text-right text-xs font-black text-white/50">{result.statusLabel}</div>
            </div>

            <div className="mt-4 text-sm leading-6 text-white/65">{providerText(result)}</div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/[.04] p-3">
                <div className="text-[10px] text-white/30">MỆNH GIÁ KHAI BÁO</div>
                <div className="mt-1 font-black">{formatVnd(result.declaredAmount)}</div>
              </div>
              <div className="rounded-xl bg-white/[.04] p-3">
                <div className="text-[10px] text-white/30">NAPPAY XÁC NHẬN</div>
                <div className="mt-1 font-black">{formatVnd(result.value)}</div>
              </div>
              <div className="rounded-xl bg-white/[.04] p-3">
                <div className="text-[10px] text-white/30">SHOP ĐÃ CỘNG</div>
                <div className="mt-1 font-black text-green-200">{formatVnd(result.creditedAmount)}</div>
              </div>
            </div>

            {result.status === 99 && !result.credited && (
              <Button loading={checking} onClick={checkNow} className="mt-4 w-full" variant="secondary">
                Kiểm tra lại giao dịch
              </Button>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}
