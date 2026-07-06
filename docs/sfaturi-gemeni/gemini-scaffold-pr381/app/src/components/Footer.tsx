import { Zap, Twitter, MessageCircle, Globe } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-12 bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 w-6 h-6" aria-hidden="true" />
            <span className="text-xl font-bold text-white tracking-tighter">SOLARIS CET</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter"><Twitter aria-hidden="true" /></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Telegram"><MessageCircle aria-hidden="true" /></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Website"><Globe aria-hidden="true" /></a>
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
