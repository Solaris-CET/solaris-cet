import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navigation from './components/Navigation';
import HeroSection from './sections/HeroSection';
import HybridEngineSection from './sections/HybridEngineSection';
import IntelligenceCoreSection from './sections/IntelligenceCoreSection';
import NovaAppSection from './sections/NovaAppSection';
import TokenomicsSection from './sections/TokenomicsSection';
import ComplianceSection from './sections/ComplianceSection';
import MiningCalculatorSection from './sections/MiningCalculatorSection';
import SecuritySection from './sections/SecuritySection';
import FooterSection from './sections/FooterSection';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initial load animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    
    return () => clearTimeout(timer);
  }, []);

  const buildSnapTo = useCallback((pinnedRanges: { start: number; end: number; center: number }[]) => {
    return (value: number) => {
      const inPinned = pinnedRanges.some(
        r => value >= r.start - 0.02 && value <= r.end + 0.02
      );
      if (!inPinned) return value;

      let closest = pinnedRanges[0]?.center ?? 0;
      let closestDist = Math.abs(closest - value);
      for (let i = 1; i < pinnedRanges.length; i++) {
        const dist = Math.abs(pinnedRanges[i].center - value);
        if (dist < closestDist) {
          closestDist = dist;
          closest = pinnedRanges[i].center;
        }
      }
      return closest;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    // Setup global snap for pinned sections
    const setupGlobalSnap = () => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);
      
      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: buildSnapTo(pinnedRanges),
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    };

    // Delay snap setup to ensure all ScrollTriggers are created
    const snapTimer = setTimeout(setupGlobalSnap, 500);

    return () => {
      clearTimeout(snapTimer);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [isLoaded, buildSnapTo]);

  return (
    <div ref={mainRef} className="relative bg-solaris-dark min-h-screen">
      {/* Noise overlay */}
      <div className="noise-overlay" />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main content */}
      <main className="relative">
        {/* Section 1: Hero - pin: true */}
        <div className="relative z-10">
          <HeroSection />
        </div>
        
        {/* Section 2: Hybrid Engine - pin: true */}
        <div className="relative z-20">
          <HybridEngineSection />
        </div>
        
        {/* Section 3: Intelligence Core - pin: true */}
        <div className="relative z-30">
          <IntelligenceCoreSection />
        </div>
        
        {/* Section 4: Nova App - pin: true */}
        <div className="relative z-40">
          <NovaAppSection />
        </div>
        
        {/* Section 5: Tokenomics - pin: true */}
        <div className="relative z-50">
          <TokenomicsSection />
        </div>
        
        {/* Section 6: Compliance - pin: true */}
        <div className="relative z-[60]">
          <ComplianceSection />
        </div>
        
        {/* Section 7: Mining Calculator - pin: false */}
        <div className="relative z-[70]">
          <MiningCalculatorSection />
        </div>
        
        {/* Section 8: Security - pin: false */}
        <div className="relative z-[80]">
          <SecuritySection />
        </div>
        
        {/* Section 9: Footer - pin: false */}
        <div className="relative z-[90]">
          <FooterSection />
        </div>
      </main>
    </div>
  );
}

export default App;
