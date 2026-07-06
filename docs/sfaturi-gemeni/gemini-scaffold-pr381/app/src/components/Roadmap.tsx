export const Roadmap = () => {
  const steps = [
    { phase: "Phase 1", title: "Foundation", items: ["9,000 CET Token Minting", "Cetățuia Community Onboarding", "Puiești Infrastructure Setup"] },
    { phase: "Phase 2", title: "AI Integration", items: ["Precision Farming Pilot", "Smart Processing Unit Launch", "Local Economic Data Modeling"] },
    { phase: "Phase 3", title: "Scaling", items: ["Regional Innovation Hubs", "AI-Driven Yield Optimization", "Sustainable Growth Metrics"] },
    { phase: "Phase 4", title: "Autonomy", items: ["Community-Led Governance", "Decentralized Resource Management", "Global Rural Tech Bridge"] }
  ];

  return (
    <section id="roadmap" className="py-24 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-amber-500 font-bold uppercase tracking-[0.2em] text-sm mb-4">The Journey</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Strategic Roadmap</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative p-8 rounded-3xl bg-white/5 border border-white/10">
              <div className="absolute -top-4 left-8 px-4 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                {step.phase}
              </div>
              <h4 className="text-xl font-bold text-white mb-6 mt-2">{step.title}</h4>
              <ul className="space-y-4">
                {step.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
