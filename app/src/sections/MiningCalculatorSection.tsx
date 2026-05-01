import { Calculator, Laptop, Monitor, Server, Smartphone, TrendingUp } from 'lucide-react';
import type { ComponentType } from 'react';
import { useCallback,useEffect, useRef, useState } from 'react';

import { meshStandardBurstFromKey, meshWhisperFromKey } from '@/lib/meshSkillFeed';

import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { useLanguage } from '../hooks/useLanguage';
import type { MiningInput, MiningResult } from '../lib/mining-math';

const BTC_S_SYMBOL = 'BTC-S';

type DeviceType = 'smartphone' | 'laptop' | 'desktop' | 'node';

interface DeviceSpec {
  icon: ComponentType<{ className?: string }>;
  baseHashrate: number;
  efficiency: number;
}

const DEVICES: Record<DeviceType, DeviceSpec> = {
  smartphone: { icon: Smartphone, baseHashrate: 0.5, efficiency: 0.8 },
  laptop: { icon: Laptop, baseHashrate: 2.5, efficiency: 0.9 },
  desktop: { icon: Monitor, baseHashrate: 8.0, efficiency: 1.0 },
  node: { icon: Server, baseHashrate: 50.0, efficiency: 1.2 },
};

const HIGH_EFFICIENCY_THRESHOLD = 0.01;
const STANDARD_EFFICIENCY_THRESHOLD = 0.001;

/** Illustrative row values; labels from `t.miningCalculator.liveStatLabels`. */
const LIVE_STATS_ROWS = [
  { id: 'networkHashrate' as const, value: '2.4 EH/s', change: '+12%' },
  { id: 'activeMiners' as const, value: '18,420', change: '+5%' },
  { id: 'avgBlockTime' as const, value: '2.0s', change: 'Stable' },
  { id: 'rewardPerBlock' as const, value: `6.25 ${BTC_S_SYMBOL}`, change: '-2%' },
];

const MiningCalculatorSection = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [device, setDevice] = useState<DeviceType>('smartphone');
  const [hashrate, setHashrate] = useState(DEVICES.smartphone.baseHashrate);
  const [stake, setStake] = useState(100);
  const [results, setResults] = useState({ daily: 0, monthly: 0, apy: 0 });

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
        setResults({
          daily: Number(daily.toFixed(4)),
          monthly: Number(monthly.toFixed(2)),
          apy: Number(apy.toFixed(1)),
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
    const deviceConfig = DEVICES[device];
    const input: MiningInput = {
      adjustedHashrate: hashrate * deviceConfig.efficiency,
      stake,
    };
    workerRef.current?.postMessage({ type: 'CALCULATE_REWARDS', payload: input });
  }, [device, hashrate, stake]);

  const handleDeviceChange = useCallback((newDevice: DeviceType) => {
    setDevice(newDevice);
    setHashrate(DEVICES[newDevice].baseHashrate);
  }, []);

  return (
    <section
      id="mining"
      ref={sectionRef}
      className="relative section-glass section-padding-y overflow-hidden mesh-bg"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        {/* Heading */}
        <div ref={headingRef} className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-solaris-gold/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">{t.miningCalculator.kicker}</span>
          </div>
          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] text-solaris-text mb-3">
            {t.miningCalculator.title}
          </h2>
          <p className="text-solaris-muted text-base lg:text-lg max-w-xl">
            {t.miningCalculator.subtitle}
          </p>
          <p className="mt-2 text-xs text-solaris-muted/85 max-w-xl leading-relaxed">
            {t.miningCalculator.estimateDisclaimer}
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {/* Input Card */}
          <div ref={calculatorRef} className="bento-card p-6 lg:p-8">
            <h3 className="font-display font-semibold text-lg text-solaris-text mb-6">
              {t.miningCalculator.configureTitle}
            </h3>

            {/* Device Selection */}
            <div className="mb-6">
              <label className="hud-label mb-3 block">{t.miningCalculator.deviceTypeLabel}</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="group" aria-label={t.sectionAria.miningDeviceTypes}>
                {(Object.keys(DEVICES) as DeviceType[]).map((deviceType) => {
                  const DeviceIcon = DEVICES[deviceType].icon;
                  return (
                    <button
                      key={deviceType}
                      onClick={() => handleDeviceChange(deviceType)}
                      aria-pressed={device === deviceType}
                      title={meshStandardBurstFromKey(`miningCalc|device|${deviceType}`)}
                      type="button"
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
                        {t.miningCalculator.devices[deviceType]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hashrate Slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label
                  htmlFor="hashrate-slider"
                  className="hud-label"
                  title={meshWhisperFromKey('miningCalc|slider|hashrate')}
                >
                  {t.miningCalculator.hashrateLabel}
                </label>
                <span className="font-mono text-solaris-gold">{hashrate.toFixed(1)}</span>
              </div>
              <input
                id="hashrate-slider"
                type="range"
                min={DEVICES[device].baseHashrate * 0.5}
                max={DEVICES[device].baseHashrate * 3}
                step={0.1}
                value={hashrate}
                onChange={(e) => setHashrate(Number(e.target.value))}
                className="w-full h-2 rounded-full bg-white/10 appearance-none cursor-pointer accent-solaris-gold"
              />
            </div>

            {/* Stake Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label
                  htmlFor="stake-slider"
                  className="hud-label"
                  title={meshWhisperFromKey('miningCalc|slider|stake')}
                >
                  {t.miningCalculator.stakeLabel}
                </label>
                <span className="font-mono text-solaris-cyan">{stake}</span>
              </div>
              <input
                id="stake-slider"
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
              {t.miningCalculator.projectedEarningsTitle}
            </h3>

            <div className="space-y-6" aria-live="polite" aria-atomic="true">
              <div className="p-5 rounded-xl bg-white/5">
                <div className="hud-label mb-2">{t.miningCalculator.dailyYieldLabel}</div>
                <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-3xl lg:text-4xl text-solaris-gold">
                      {results.daily.toFixed(4)}
                    </span>
                    <span className="text-solaris-muted">{BTC_S_SYMBOL}</span>
                  </div>
                <p
                  className="mt-3 text-[9px] font-mono text-fuchsia-200/60 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-2"
                  title={meshWhisperFromKey('miningCalc|yield|daily')}
                >
                  {meshWhisperFromKey('miningCalc|yield|daily')}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5">
                <div className="hud-label mb-2">{t.miningCalculator.monthlyProjectionLabel}</div>
                <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-3xl lg:text-4xl text-solaris-cyan">
                      {results.monthly.toFixed(2)}
                    </span>
                    <span className="text-solaris-muted">{BTC_S_SYMBOL}</span>
                  </div>
                <p
                  className="mt-3 text-[9px] font-mono text-fuchsia-200/60 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-2"
                  title={meshWhisperFromKey('miningCalc|yield|monthly')}
                >
                  {meshWhisperFromKey('miningCalc|yield|monthly')}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-emerald-400/5 border border-emerald-400/20">
                <div className="hud-label text-emerald-400 mb-2">{t.miningCalculator.apyRangeLabel}</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-3xl lg:text-4xl text-emerald-400">
                    {results.apy.toFixed(1)}%
                  </span>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <p
                  className="mt-3 text-[9px] font-mono text-fuchsia-200/60 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-2"
                  title={meshWhisperFromKey('miningCalc|yield|apy')}
                >
                  {meshWhisperFromKey('miningCalc|yield|apy')}
                </p>
              </div>

              {/* Mining Efficiency Tier */}
              <div className="flex justify-center pt-1">
                {results.daily >= HIGH_EFFICIENCY_THRESHOLD ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-solaris-gold/10 border border-solaris-gold/30 text-solaris-gold text-xs font-semibold tracking-wide">
                    ⚡ {t.miningCalculator.efficiencyHigh}
                  </span>
                ) : results.daily >= STANDARD_EFFICIENCY_THRESHOLD ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-solaris-cyan/10 border border-solaris-cyan/30 text-solaris-cyan text-xs font-semibold tracking-wide">
                    ✓ {t.miningCalculator.efficiencyStandard}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-solaris-muted text-xs font-semibold tracking-wide">
                    ○ {t.miningCalculator.efficiencyConservative}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Stats Row */}
        <div
          ref={statsRef}
          className="bento-card p-5 lg:p-6"
        >
          <div className="hud-label mb-4">{t.miningCalculator.liveNetworkStatsTitle}</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {LIVE_STATS_ROWS.map((stat) => (
              <div key={stat.id} className="p-4 rounded-lg bg-white/5">
                <div className="text-solaris-muted text-sm mb-1">
                  {t.miningCalculator.liveStatLabels[stat.id]}
                </div>
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
                <p
                  className="mt-2 text-[9px] font-mono text-fuchsia-200/55 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-2"
                  title={meshWhisperFromKey(`miningCalc|live|${stat.id}`)}
                >
                  {meshWhisperFromKey(`miningCalc|live|${stat.id}`)}
                </p>
              </div>
            ))}
          </div>
          <MeshSkillRibbon
            variant="compact"
            saltOffset={2410}
            className="mt-4 border-t border-white/8 rounded-none border-x-0 border-b-0 bg-fuchsia-500/[0.03] pt-3"
          />
        </div>

        <p className="text-solaris-muted text-[11px] leading-relaxed mt-4 text-center opacity-60">
          {t.miningCalculator.footnoteBottom}
        </p>
      </div>
    </section>
  );
};

export default MiningCalculatorSection;
