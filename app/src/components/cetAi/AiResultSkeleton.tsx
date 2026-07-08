export function AiResultSkeleton({ label }: { label: string }) {
  return (
    <div className="flex justify-start motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <div className="bg-black/30 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4 max-w-2xl w-full">
        <p className="text-white/60 text-xs font-mono mb-3 uppercase tracking-widest">{label}</p>
        <div role="status" aria-label={label}>
          <div className="h-3 rounded bg-white/10 motion-safe:animate-pulse w-[82%]" />
          <div className="mt-2 h-3 rounded bg-white/10 motion-safe:animate-pulse w-[64%]" />
          <div className="mt-2 h-3 rounded bg-white/10 motion-safe:animate-pulse w-[74%]" />
        </div>
      </div>
    </div>
  );
}
