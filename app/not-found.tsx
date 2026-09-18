export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-4">
      <div className="lv-glass rounded-3xl p-8 text-center">
        <div className="text-xs font-black uppercase tracking-[.2em] text-cyan-300/70">404</div>
        <h1 className="mt-3 text-3xl font-black">Không tìm thấy trang</h1>
        <p className="mt-3 text-sm text-white/45">Trang bạn yêu cầu không tồn tại hoặc đã được di chuyển.</p>
      </div>
    </div>
  );
}
