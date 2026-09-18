export function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return <div className="mb-8 max-w-3xl"><div className="mb-2 text-xs font-black uppercase tracking-[.25em] text-cyan-300/70">{eyebrow}</div><h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>{desc && <p className="mt-3 text-sm leading-7 text-white/50">{desc}</p>}</div>;
}
