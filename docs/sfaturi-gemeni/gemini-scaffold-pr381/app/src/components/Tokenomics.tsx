export const Tokenomics = () => {
  return (
    <section id="tokenomics" className="py-24 bg-zinc-950 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-br from-amber-500/10 to-blue-500/10 border border-white/10 rounded-[40px] p-8 md:p-16 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-[100px] -mr-32 -mt-32" />
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-amber-500 font-bold uppercase tracking-[0.2em] text-sm mb-4">Tokenomics</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-8">Engineered for Scarcity</h3>
              
              <div className="space-y-6">
                {[
                  { label: "Total Supply", value: "9,000 CET", sub: "Fixed forever" },
                  { label: "Network", value: "TON Blockchain", sub: "Ultra-fast & Scalable" },
                  { label: "AI Reserve", value: "20%", sub: "Agent ecosystem funding" },
                  { label: "Public Sale", value: "60%", sub: "Community driven" }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div>
                      <div className="text-gray-400 text-sm">{stat.label}</div>
                      <div className="text-xs text-gray-600">{stat.sub}</div>
                    </div>
                    <div className="text-xl font-mono font-bold text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative flex items-center justify-center">
              <div className="w-full max-w-sm aspect-square relative">
                {/* Simple Pie Chart Representation */}
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90" aria-label="Tokenomics distribution chart">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#18181b" strokeWidth="20" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20" strokeDasharray="150 251.2" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="20" strokeDasharray="50 251.2" strokeDashoffset="-150" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="51.2 251.2" strokeDashoffset="-200" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-mono font-bold text-white">9K</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total CET</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
