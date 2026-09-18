export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[48vh] max-w-7xl items-center justify-center px-4">
      <div className="lv-glass lv-glow rounded-3xl px-8 py-7 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300" />
        <p className="mt-4 text-sm text-white/45">Đang tải hệ thống Lù A Vang…</p>
      </div>
    </div>
  );
}
