import { motion } from "motion/react";
import { Zap, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export const Navbar = () => {
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

        <button 
          className="md:hidden text-white" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
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
