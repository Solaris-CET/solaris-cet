import { useRef, useLayoutEffect, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { Calculator, Smartphone, Laptop, Monitor, Server, TrendingUp } from 'lucide-react';
import type { MiningInput, MiningResult } from '../lib/mining-math';


type DeviceType = 'smartphone' | 'laptop' | 'desktop' | 'node';

interface DeviceConfig {
  icon: React.ElementType;
  label: string;
  baseHashrate: number;
  efficiency: number;
}

const devices: Record<DeviceType, DeviceConfig> = {
  smartphone: { icon: Smartphone, label: 'Smartphone', baseHashrate: 0.5, efficiency: 0.8 },
  laptop: { icon: Laptop, label: 'Laptop', baseHashrate: 2.5, efficiency: 0.9 },
  desktop: { icon: Monitor, label: 'Desktop', baseHashrate: 8.0, efficiency: 1.0 },
  node: { icon: Server, label: 'Dedicated Node', baseHashrate: 50.0, efficiency: 1.2 },
};

// Static data defined outside component to avoid re-creation on every render
const liveStats = [
  { label: 'Network Hashrate', value: '2.4 EH/s', change: '+12%' },
  { label: 'Active Miners', value: '18,420', change: '+5%' },
  { label: 'Avg Block Time', value: '2.0s', change: 'Stable' },
  { label: 'Reward per Block', value: '6.25 BTC-S', change: '-2%' },
];

const MiningCalculatorSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [device, setDevice] = useState<DeviceType>('smartphone');
  const [hashrate, setHashrate] = useState(0.5);
  const [stake, setStake] = useState(100);
  const [results, setResults] = useState({ daily: 0, monthly: 0, apy: 0 });

  // Use a stable ref to hold the animated proxy object so GSAP tweens don't
  // target a stale closure value across renders.
  const animProxy = useRef({ daily: 0, monthly: 0, apy: 0 });

  // Web Worker instance — created once, persisted across renders
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/mining.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (
      event: MessageEvent<{ type: string; payload: MiningResult }>
    ) => {
      if (event.data.type === 'REWARDS_RESULT') {
        const { daily, monthly, apy } = event.data.payload;
        const proxy = animProxy.current;

        gsap.to(proxy, {
          daily,
          monthly,
          apy,
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: () => {
            setResults({
              daily: Number(proxy.daily.toFixed(4)),
              monthly: Number(proxy.monthly.toFixed(2)),
              apy: Number(proxy.apy.toFixed(1)),
            });
          },
        });
      }
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Send calculation request to the worker whenever inputs change
  useEffect(() => {
    const deviceConfig = devices[device];
    const input: MiningInput = {
      adjustedHashrate: hashrate * deviceConfig.efficiency,
      stake,
    };
    workerRef.current?.postMessage({ type: 'CALCULATE_REWARDS', payload: input });
  }, [device, hashrate, stake]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        headingRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 80%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      // Calculator card animation
      gsap.fromTo(
        calculatorRef.current,
        { x: '-10vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: calculatorRef.current,
            start: 'top 80%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      // Result card animation
      gsap.fromTo(
        resultRef.current,
        { x: '10vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: resultRef.current,
            start: 'top 80%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      // Stats row animation
      gsap.fromTo(
        statsRef.current,
        { y: '6vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 85%',
            end: 'top 65%',
            scrub: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleDeviceChange = useCallback((newDevice: DeviceType) => {
    setDevice(newDevice);
    setHashrate(devices[newDevice].baseHashrate);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-solaris-dark py-24 lg:py-32"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
      </div>

      <div className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto">
        {/* Heading */}
        <div ref={headingRef} className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-solaris-gold/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">Estimate Your Rewards</span>
          </div>
          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] text-solaris-text mb-3">
            Mining Calculator
          </h2>
          <p className="text-solaris-muted text-base lg:text-lg max-w-xl">
            Estimate your daily yield based on device type, hashrate, and staking multiplier.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {/* Input Card */}
          <div ref={calculatorRef} className="glass-card p-6 lg:p-8">
            <h3 className="font-display font-semibold text-lg text-solaris-text mb-6">
              Configure Your Setup
            </h3>

            {/* Device Selection */}
            <div className="mb-6">
              <label className="hud-label mb-3 block">Device Type</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(Object.keys(devices) as DeviceType[]).map((deviceType) => {
                  const DeviceIcon = devices[deviceType].icon;
                  return (
                    <button
                      key={deviceType}
                      onClick={() => handleDeviceChange(deviceType)}
                      className={`p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                        device === deviceType
                          ? 'bg-solaris-gold/10 border-solaris-gold'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <DeviceIcon
                        className={`w-5 h-5 ${
                          device === deviceType ? 'text-solaris-gold' : 'text-solaris-muted'
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          device === deviceType ? 'text-solaris-text' : 'text-solaris-muted'
                        }`}
                      >
                        {devices[deviceType].label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hashrate Slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="hud-label">Hashrate (TH/s)</label>
                <span className="font-mono text-solaris-gold">{hashrate.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={devices[device].baseHashrate * 0.5}
                max={devices[device].baseHashrate * 3}
                step={0.1}
                value={hashrate}
                onChange={(e) => setHashrate(Number(e.target.value))}
                className="w-full h-2 rounded-full bg-white/10 appearance-none cursor-pointer accent-solaris-gold"
              />
            </div>

            {/* Stake Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="hud-label">Stake (BTC-S)</label>
                <span className="font-mono text-solaris-cyan">{stake}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10000}
                step={100}
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                className="w-full h-2 rounded-full bg-white/10 appearance-none cursor-pointer accent-solaris-cyan"
              />
            </div>
          </div>

          {/* Results Card */}
          <div ref={resultRef} className="glass-card-gold p-6 lg:p-8">
            <h3 className="font-display font-semibold text-lg text-solaris-text mb-6">
              Projected Earnings
            </h3>

            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-white/5">
                <div className="hud-label mb-2">Daily Yield (est)</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-3xl lg:text-4xl text-solaris-gold">
                    {results.daily.toFixed(4)}
                  </span>
                  <span className="text-solaris-muted">BTC-S</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/5">
                <div className="hud-label mb-2">Monthly Projection</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-3xl lg:text-4xl text-solaris-cyan">
                    {results.monthly.toFixed(2)}
                  </span>
                  <span className="text-solaris-muted">BTC-S</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-emerald-400/5 border border-emerald-400/20">
                <div className="hud-label text-emerald-400 mb-2">APY Range</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-3xl lg:text-4xl text-emerald-400">
                    {results.apy.toFixed(1)}%
                  </span>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Stats Row */}
        <div
          ref={statsRef}
          className="glass-card p-5 lg:p-6"
        >
          <div className="hud-label mb-4">Live Network Stats</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {liveStats.map((stat) => (
              <div key={stat.label} className="p-4 rounded-lg bg-white/5">
                <div className="text-solaris-muted text-sm mb-1">{stat.label}</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-solaris-text font-semibold">{stat.value}</span>
                  <span
                    className={`text-xs ${
                      stat.change.startsWith('+')
                        ? 'text-emerald-400'
                        : stat.change.startsWith('-')
                        ? 'text-red-400'
                        : 'text-solaris-muted'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MiningCalculatorSection;
