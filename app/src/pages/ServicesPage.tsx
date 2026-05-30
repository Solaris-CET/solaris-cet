import { Sun, Home, ShieldCheck, Zap, Settings, FileText } from "lucide-react";
import { useLanguage } from '../hooks/useLanguage';

export default function ServicesPage() {
  const { t } = useLanguage();
  void t;

  const services = [
    {
      title: "PV Installation",
      desc: "End-to-end solar solutions for industrial and residential energy independence.",
      icon: Sun,
      items: ["Industrial Rooftops", "Energy Storage", "Grid Integration"]
    },
    {
      title: "General Construction",
      desc: "Turnkey engineering projects with high structural integrity and professional finishing.",
      icon: FileText,
      items: ["Foundations", "Metal Structures", "Building Envelopes"]
    },
    {
      title: "Roofing & TPO",
      desc: "Specialized waterproofing and roofing systems using durable TPO membranes.",
      icon: Home,
      items: ["TPO Waterproofing", "Thermal Insulation", "Roof Maintenance"]
    },
    {
      title: "Parapets & Facades",
      desc: "Modern facade systems and safety parapets for industrial building compliance.",
      icon: ShieldCheck,
      items: ["Ventilated Facades", "Safety Railings", "Aesthetic Cladding"]
    },
    {
      title: "Electrical & Zap",
      desc: "High-voltage and low-voltage electrical systems for industrial infrastructure.",
      icon: Zap,
      items: ["Power Distribution", "Industrial Lighting", "Safety Systems"]
    },
    {
      title: "Repairs & Maintenance",
      desc: "Professional maintenance services to extend the lifecycle of your infrastructure.",
      icon: Settings,
      items: ["Structural Repairs", "System Audits", "Periodic Maintenance"]
    }
  ];

  return (
    <main id="main-content" className="relative z-10 pt-24 pb-20 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 uppercase tracking-tighter">
          Our <span className="text-solaris-gold">Services</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          High-performance engineering and construction solutions anchored in Romanian excellence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <div key={i} className="group bg-slate-900/40 border border-white/10 p-8 rounded-3xl backdrop-blur-xl hover:border-solaris-gold/30 transition-all duration-500">
            <div className="w-14 h-14 rounded-2xl bg-solaris-gold/10 flex items-center justify-center mb-6 group-hover:bg-solaris-gold/20 transition-colors">
              <s.icon className="w-7 h-7 text-solaris-gold" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">{s.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {s.desc}
            </p>
            <ul className="space-y-2">
              {s.items.map((item, ii) => (
                <li key={ii} className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-solaris-gold/40" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-gradient-to-r from-solaris-gold/20 to-transparent p-12 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Ready to start a project?</h2>
          <p className="text-slate-400">Get a professional quote for your engineering needs.</p>
        </div>
        <a href="/contact" className="btn-gold px-10 py-4 text-lg btn-quantum-float">
          Contact us now
        </a>
      </div>
    </main>
  );
}
