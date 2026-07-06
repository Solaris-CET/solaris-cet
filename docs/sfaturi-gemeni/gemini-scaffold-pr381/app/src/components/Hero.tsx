import { motion } from "motion/react";
import { Zap, ArrowRight, Bot, Shield } from "lucide-react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export const Hero = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_50%)]" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -50 }}
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
              Explore Ecosystem <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </button>
            <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold px-8 py-4 rounded-2xl transition-all">
              Community Portal
            </button>
          </div>
          
          <div className="mt-12 flex items-center gap-8">
            <div>
              <div className="text-2xl font-mono font-bold text-white">9,000</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Fixed Supply</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="text-2xl font-mono font-bold text-white">TON</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Blockchain</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="text-2xl font-mono font-bold text-white">Puiești</div>
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
                animate={shouldReduceMotion ? {} : { rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-full h-full border-2 border-dashed border-amber-500/20 rounded-full"
              />
              <motion.div 
                animate={shouldReduceMotion ? {} : { rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-3/4 h-3/4 border-2 border-dashed border-blue-500/20 rounded-full"
              />
              
              {/* Central Token Icon */}
              <div className="relative z-20 w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.4)]">
                <Zap className="text-black w-16 h-16 fill-current" aria-hidden="true" />
              </div>
              
              {/* Floating AI Nodes */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={shouldReduceMotion ? {} : { 
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
                  <Bot className="w-6 h-6 text-amber-500" aria-hidden="true" />
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
                <Shield className="w-4 h-4 text-blue-400" aria-hidden="true" />
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
