export const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-amber-500/5" />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to join the <br /> <span className="text-amber-500">AI-Native</span> future?</h2>
        <p className="text-gray-400 text-lg mb-12">
          Be part of the most exclusive RWA ecosystem on TON. Limited supply, infinite potential.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="w-full sm:w-auto bg-amber-500 text-black font-bold px-12 py-5 rounded-2xl text-lg hover:bg-amber-600 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            Get $CET Now
          </button>
          <button className="w-full sm:w-auto bg-white/5 text-white border border-white/10 font-bold px-12 py-5 rounded-2xl text-lg hover:bg-white/10 transition-all">
            Join Telegram
          </button>
        </div>
      </div>
    </section>
  );
};
