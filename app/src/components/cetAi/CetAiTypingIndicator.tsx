export function CetAiTypingIndicator({ label }: { label: string }) {
  return (
    <div
      className="flex justify-start motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
      aria-live="polite"
      aria-label={label}
    >
      <div className="bg-gradient-to-br from-green-950/60 to-black border border-green-500/20 rounded-2xl rounded-tl-sm px-5 py-4 max-w-2xl w-full">
        <p className="text-green-400 text-xs font-mono mb-2 uppercase tracking-widest">{label}</p>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-500/80 motion-safe:animate-bounce [animation-delay:-0.2s]" />
          <span className="h-2 w-2 rounded-full bg-yellow-500/70 motion-safe:animate-bounce [animation-delay:-0.1s]" />
          <span className="h-2 w-2 rounded-full bg-yellow-500/60 motion-safe:animate-bounce" />
          <span className="text-[11px] font-mono text-solaris-muted">RAV · Grok × Gemini</span>
        </div>
      </div>
    </div>
  );
}
