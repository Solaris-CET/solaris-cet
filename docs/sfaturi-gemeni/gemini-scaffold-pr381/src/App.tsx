/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { 
  Cpu, 
  Globe, 
  Shield, 
  Zap, 
  ArrowRight, 
  Twitter, 
  MessageCircle, 
  BarChart3, 
  Layers, 
  Bot,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10 py-4" : "bg-transparent py-6"}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap className="text-black w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white">SOLARIS <span className="text-amber-500">CET</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Protocol", "Tokenomics", "AI Agents", "Roadmap"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              {item}
            </a>
          ))}
          <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-amber-500 hover:text-white transition-all transform hover:scale-105">
            Launch App
          </button>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-0 right-0 bg-black border-b border-white/10 p-6 flex flex-col gap-4"
        >
          {["Protocol", "Tokenomics", "AI Agents", "Roadmap"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="text-lg font-medium text-gray-400" onClick={() => setIsMenuOpen(false)}>
              {item}
            </a>
          ))}
          <button className="bg-amber-500 text-white px-5 py-3 rounded-xl text-center font-bold">
            Launch App
          </button>
        </motion.div>
      )}
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_50%)]" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-amber-500 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Digital Foundation of Cetățuia
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6">
            Scaling <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
              Rural Innovation
            </span> via AI
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-xl leading-relaxed">
            Solaris CET is a hyper-scarce token on the TON blockchain, driving precision farming and sustainable development in Puiești.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-4 rounded-2xl flex items-center gap-2 transition-all group">
              Explore Ecosystem <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold px-8 py-4 rounded-2xl transition-all">
              Community Portal
            </button>
          </div>
          
          <div className="mt-12 flex items-center gap-8">
            <div>
              <div className="text-2xl font-bold text-white">9,000</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Fixed Supply</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="text-2xl font-bold text-white">TON</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Blockchain</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="text-2xl font-bold text-white">Puiești</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Location</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <div className="relative z-10 w-full aspect-square rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-sm overflow-hidden flex items-center justify-center p-12">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Animated Rings */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-full h-full border-2 border-dashed border-amber-500/20 rounded-full"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-3/4 h-3/4 border-2 border-dashed border-blue-500/20 rounded-full"
              />
              
              {/* Central Token Icon */}
              <div className="relative z-20 w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.4)]">
                <Zap className="text-black w-16 h-16 fill-current" />
              </div>
              
              {/* Floating AI Nodes */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -10, 0],
                    x: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 3 + i, 
                    repeat: Infinity, 
                    delay: i * 0.5 
                  }}
                  className={`absolute w-12 h-12 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-xl`}
                  style={{
                    top: `${50 + 40 * Math.sin((i * 60 * Math.PI) / 180)}%`,
                    left: `${50 + 40 * Math.cos((i * 60 * Math.PI) / 180)}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Bot className="w-6 h-6 text-amber-500" />
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Floating Card */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -bottom-6 -left-6 z-20 bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl max-w-[200px]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Secure</span>
            </div>
            <p className="text-[10px] text-gray-400">RAV Protocol ensures multi-layered security for all RWA assets.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "Precision Farming",
      description: "AI-driven agricultural optimization in Puiești, maximizing yield and sustainability through real-time data."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Rural Innovation",
      description: "Scaling local economic growth by integrating next-gen processing units and smart infrastructure."
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: "Community Foundation",
      description: "Solaris (CET) serves as the digital foundation for the Cetățuia community, fostering local development."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Hyper-Scarcity",
      description: "A strictly fixed supply of 9,000 tokens on the TON blockchain, ensuring value preservation for the community."
    }
  ];

  return (
    <section id="protocol" className="py-24 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-amber-500 font-bold uppercase tracking-[0.2em] text-sm mb-4">Our Mission</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Sustainable Local Growth</h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            We bridge the gap between advanced AI technology and rural development, creating a robust tech solution for sustainable communities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/50 transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-white mb-4">{feature.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Tokenomics = () => {
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
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative flex items-center justify-center">
              <div className="w-full max-w-sm aspect-square relative">
                {/* Simple Pie Chart Representation */}
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#18181b" strokeWidth="20" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20" strokeDasharray="150 251.2" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="20" strokeDasharray="50 251.2" strokeDashoffset="-150" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="51.2 251.2" strokeDashoffset="-200" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-white">9K</div>
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

const Footer = () => {
  return (
    <footer className="py-12 bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 w-6 h-6" />
            <span className="text-xl font-bold text-white tracking-tighter">SOLARIS CET</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter /></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><MessageCircle /></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Globe /></a>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© 2026 Solaris CET. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-400">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400">Terms of Service</a>
            <a href="#" className="hover:text-gray-400">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Roadmap = () => {
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
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
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

export default function App() {
  return (
    <div className="bg-black min-h-screen font-sans text-white selection:bg-amber-500 selection:text-black">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Tokenomics />
        <Roadmap />
        
        {/* CTA Section */}
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
      </main>
      <Footer />
    </div>
  );
}
