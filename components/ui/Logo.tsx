import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="Lù A Vang">
      <span className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.06] shadow-[0_0_35px_rgba(155,92,255,.22)]">
        <span className="absolute inset-1 rounded-lg bg-gradient-to-br from-purple-500/80 via-blue-400/40 to-pink-500/70 opacity-75 blur-sm" />
        <span className="relative text-sm font-black tracking-tight text-white">LV</span>
      </span>
      <span className="leading-none">
        <span className="block text-sm font-black uppercase tracking-[.24em] text-white">LÙ A VANG</span>
        <span className="mt-1 block text-[10px] font-semibold tracking-[.24em] text-white/40">DIGITAL // STORE</span>
      </span>
    </Link>
  );
}
